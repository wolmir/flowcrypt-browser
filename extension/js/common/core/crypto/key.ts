/* ©️ 2016 - present FlowCrypt a.s. Limitations apply. Contact human@flowcrypt.com */

'use strict';

import { Buf } from '../buf.js';
import { Catch, UnreportableError } from '../../platform/catch.js';
import { MsgBlockParser } from '../msg-block-parser.js';
import { PgpArmor } from './pgp/pgp-armor.js';
import { opgp } from './pgp/openpgpjs-custom.js';
import { OpenPGPKey, PgpKey } from './pgp/openpgp-key.js';
import { SmimeKey } from './smime/smime-key.js';

/**
 * This is a common Pubkey interface for both pgp and x509 keys
 */
export interface Key {
  type: 'openpgp' | 'x509';
  id: string; // This is a fingerprint for OpenPGP keys and Serial Number for X.509 keys.
  ids: string[];
  created: Date;
  lastModified: Date | undefined;
  expiration: Date | undefined;
  usableForEncryption: boolean;
  usableForSigning: boolean;
  usableButExpired: boolean;
  emails: string[];
  identities: string[];
  fullyDecrypted: boolean;
  fullyEncrypted: boolean;
  // TODO: Aren't isPublic and isPrivate mutually exclusive?
  isPublic: boolean;
  isPrivate: boolean;
  checkPassword(password: string): Promise<boolean>;
}

export type PubkeyResult = { pubkey: Key, email: string, isMine: boolean };

export type Contact = {
  email: string;
  name: string | null;
  pubkey: Key | null;
  has_pgp: 0 | 1;
  searchable: string[];
  client: string | null;
  fingerprint: string | null;
  longid: string | null;
  longids: string[];
  pending_lookup: number;
  last_use: number | null;
  pubkey_last_sig: number | null;
  pubkey_last_check: number | null;
  expiresOn: number | null;
};

export interface PrvKeyInfo {
  private: string;
  longid: string;
  passphrase?: string;
  decrypted?: Key;  // only for internal use in this file
  parsed?: Key;     // only for internal use in this file
}

export type KeyAlgo = 'curve25519' | 'rsa2048' | 'rsa4096';

export interface KeyInfo extends PrvKeyInfo {
  // this cannot be Pubkey has it's being passed to localstorage
  public: string;
  fingerprint: string;
  primary: boolean;
}

export type KeyDetails$ids = {
  shortid: string;
  longid: string;
  fingerprint: string;
};

export interface KeyDetails {
  private?: string;
  public: Key;
  isFullyEncrypted: boolean | undefined;
  isFullyDecrypted: boolean | undefined;
  ids: KeyDetails$ids[];
  users: string[];
  created: number;
  algo: { // same as OpenPGP.key.AlgorithmInfo
    algorithm: string;
    algorithmId: number;
    bits?: number;
    curve?: string;
  };
}
export type PrvPacket = (OpenPGP.packet.SecretKey | OpenPGP.packet.SecretSubkey);

export class KeyUtil {

  public static isWithoutSelfCertifications = async (key: Key) => {
    // all non-OpenPGP keys are automatically considered to be not
    // "without self certifications"
    if (key.type !== 'openpgp') {
      return false;
    }
    return await OpenPGPKey.isWithoutSelfCertifications(key);
  }

  /**
   * Read many keys, could be armored or binary, in single armor or separately, useful for importing keychains of various formats
   */
  public static readMany = async (fileData: Buf): Promise<{ keys: Key[], errs: Error[] }> => {
    const allKeys: OpenPGP.key.Key[] = [];
    const allErrs: Error[] = [];
    const { blocks } = MsgBlockParser.detectBlocks(fileData.toUtfStr('ignore'));
    const armoredPublicKeyBlocks = blocks.filter(block => block.type === 'publicKey' || block.type === 'privateKey');
    const pushKeysAndErrs = async (content: string | Buf, isArmored: boolean) => {
      try {
        const { err, keys } = isArmored
          ? await opgp.key.readArmored(content.toString())
          : await opgp.key.read(typeof content === 'string' ? Buf.fromUtfStr(content) : content);
        allErrs.push(...(err || []));
        allKeys.push(...keys);
      } catch (e) {
        allErrs.push(e instanceof Error ? e : new Error(String(e)));
      }
    };
    if (armoredPublicKeyBlocks.length) {
      for (const block of blocks) {
        await pushKeysAndErrs(block.content, true);
      }
    } else {
      await pushKeysAndErrs(fileData, false);
    }
    return { keys: await Promise.all(allKeys.map(key => OpenPGPKey.wrap(key, {} as Key))), errs: allErrs };
  }

  public static parse = async (text: string): Promise<Key> => {
    const keyType = KeyUtil.getKeyType(text);
    if (keyType === 'openpgp') {
      return await OpenPGPKey.parse(text);
    } else if (keyType === 'x509') {
      return await SmimeKey.parse(text);
    }
    throw new Error('Unsupported key type: ' + keyType);
  }

  public static armor = (pubkey: Key): string => {
    if (pubkey.type === 'openpgp') {
      return OpenPGPKey.armor(pubkey);
    } else if (pubkey.type === 'x509') {
      return (pubkey as unknown as { raw: string }).raw;
    } else {
      throw new Error('Unknown pubkey type: ' + pubkey.type);
    }
  }

  public static asPublicKey = async (pubkey: Key): Promise<Key> => {
    // TODO: Delegate to appropriate key type
    if (pubkey.type === 'openpgp') {
      return await OpenPGPKey.asPublicKey(pubkey);
    }
    // TODO: Assuming S/MIME keys are already public: this should be fixed.
    return pubkey;
  }

  public static expired = (key: Key): boolean => {
    const exp = key.expiration;
    if (!exp) {
      return false;
    }
    if (exp instanceof Date) {
      return Date.now() > exp.getTime();
    }
    throw new Error(`Got unexpected value for expiration: ${exp}`);
  }

  public static dateBeforeExpirationIfAlreadyExpired = (key: Key): Date | undefined => {
    const expiration = key.expiration;
    return expiration && KeyUtil.expired(key) ? new Date(expiration.getTime() - 1000) : undefined;
  }

  public static parseDetails = async (armored: string): Promise<{ original: string, normalized: string, keys: KeyDetails[] }> => {
    const { normalized, keys } = await KeyUtil.normalize(armored);
    return { original: armored, normalized, keys: await Promise.all(keys.map(PgpKey.details)) };
  }

  // todo - this should be made to tolerate smime keys
  public static normalize = async (armored: string): Promise<{ normalized: string, keys: OpenPGP.key.Key[] }> => {
    try {
      let keys: OpenPGP.key.Key[] = [];
      armored = PgpArmor.normalize(armored, 'key');
      if (RegExp(PgpArmor.headers('publicKey', 're').begin).test(armored)) {
        keys = (await opgp.key.readArmored(armored)).keys;
      } else if (RegExp(PgpArmor.headers('privateKey', 're').begin).test(armored)) {
        keys = (await opgp.key.readArmored(armored)).keys;
      } else if (RegExp(PgpArmor.headers('encryptedMsg', 're').begin).test(armored)) {
        keys = [new opgp.key.Key((await opgp.message.readArmored(armored)).packets)];
      }
      for (const k of keys) {
        for (const u of k.users) {
          u.otherCertifications = []; // prevent key bloat
        }
      }
      return { normalized: keys.map(k => k.armor()).join('\n'), keys };
    } catch (error) {
      Catch.reportErr(error);
      return { normalized: '', keys: [] };
    }
  }

  public static getKeyType = (pubkey: string): 'openpgp' | 'x509' | 'unknown' => {
    if (pubkey.startsWith('-----BEGIN CERTIFICATE-----')) {
      return 'x509';
    } else if (pubkey.startsWith('-----BEGIN PGP ')) {
      // both public and private keys will be considered as 'openpgp'
      return 'openpgp';
    } else {
      return 'unknown';
    }
  }

  public static choosePubsBasedOnKeyTypeCombinationForPartialSmimeSupport = (pubs: PubkeyResult[]): Key[] => {
    const myPubs = pubs.filter(pub => pub.isMine); // currently this must be openpgp pub
    const otherPgpPubs = pubs.filter(pub => !pub.isMine && pub.pubkey.type === 'openpgp');
    const otherSmimePubs = pubs.filter(pub => !pub.isMine && pub.pubkey.type === 'x509');
    if (otherPgpPubs.length && otherSmimePubs.length) {
      let err = `Cannot use mixed OpenPGP (${otherPgpPubs.map(p => p.email).join(', ')}) and S/MIME (${otherSmimePubs.map(p => p.email).join(', ')}) public keys yet.`;
      err += 'If you need to email S/MIME recipient, do not add any OpenPGP recipient at the same time.';
      throw new UnreportableError(err);
    }
    if (otherPgpPubs.length) {
      return myPubs.concat(...otherPgpPubs).map(p => p.pubkey);
    }
    if (otherSmimePubs.length) { // todo - currently skipping my own pgp keys when encrypting message for S/MIME
      return otherSmimePubs.map(pub => pub.pubkey);
    }
    return myPubs.map(p => p.pubkey);
  }

}