/* ©️ 2016 - present FlowCrypt a.s. Limitations apply. Contact human@flowcrypt.com */

import * as ava from 'ava';

import { TestVariant, Util } from '../../util';
import { BrowserRecipe } from '../browser-recipe';
import { SetupPageRecipe } from '../page-recipe/setup-page-recipe';
import { TestWithBrowser } from '../../test';
import { expect } from 'chai';
import { SettingsPageRecipe } from '../page-recipe/settings-page-recipe';
import { ComposePageRecipe } from '../page-recipe/compose-page-recipe';
import { Str } from '../../core/common';
import { MOCK_KM_LAST_INSERTED_KEY } from '../../mock/key-manager/key-manager-endpoints';

// tslint:disable:no-blank-lines-func
// tslint:disable:no-unused-expression
/* eslint-disable no-unused-expressions */
/* eslint-disable max-len */

export const defineSetupTests = (testVariant: TestVariant, testWithBrowser: TestWithBrowser) => {

  if (testVariant !== 'CONSUMER-LIVE-GMAIL') {

    // note - `SetupPageRecipe.createKey` tests are in `defineFlakyTests` - running serially
    // because the keygen CPU spike can cause trouble to other concurrent tests

    ava.todo('setup - no connection when pulling backup - retry prompt shows and works');

    ava.todo('setup - simple - no connection when making a backup - retry prompt shows');

    ava.todo('setup - advanced - no connection when making a backup - retry prompt shows');

    ava.todo('setup - no connection when submitting public key - retry prompt shows and works');

    ava.default('settings > login > close oauth window > close popup', testWithBrowser(undefined, async (t, browser) => {
      await BrowserRecipe.openSettingsLoginButCloseOauthWindowBeforeGrantingPermission(t, browser, 'flowcrypt.test.key.imported@gmail.com');
    }));

    ava.default('setup - import key - do not submit - did not use before', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.imported@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp', { submitPubkey: false, usedPgpBefore: false });
    }));

    ava.default('setup - import key - submit - used before', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.used.pgp@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp', { submitPubkey: true, usedPgpBefore: true });
    }));

    ava.default('setup - import key - naked - choose my own pass phrase', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.import.naked@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.naked', { submitPubkey: false, usedPgpBefore: false, naked: true });
    }));

    ava.default('setup - import key - naked - auto-generate a pass phrase', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.import.naked@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.naked', { submitPubkey: false, usedPgpBefore: false, naked: true, genPp: true });
    }));

    ava.todo('setup - import key - naked - do not supply pass phrase gets error');

    ava.default('setup - import key - fix key self signatures', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.imported@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'missing.self.signatures', { submitPubkey: false, fixKey: true });
    }));

    ava.default('setup - import key - fix key self signatures - skip invalid uid', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.imported@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'missing.self.signatures.invalid.uid', { submitPubkey: false, fixKey: true });
    }));

    // This test will succeed after OpenPGP adds support for parsing keys without
    // User IDs. See: https://github.com/openpgpjs/openpgpjs/issues/1144
    //
    // The test will also succeed if local openpgp.js is patched and
    // `!this.users.length` condition is removed from the Key constructor.
    ava.failing('setup - import key - fix uids', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.imported@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'unused', {
        submitPubkey: false, fixKey: true,
        key: {
          title: 'UIDless key',
          armored: `-----BEGIN PGP PRIVATE KEY BLOCK-----

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
CciXuhqnLwoVF5/uXMYffVtfl/OU+w==
=EqcV
-----END PGP PRIVATE KEY BLOCK-----`,
          passphrase: 'correct horse battery staple',
          longid: '123',
        }
      });
    }));

    ava.default('setup - import key - two e-mails on the screen', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.imported@gmail.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'unused', {
        submitPubkey: false,
        key: {
          title: '2 UIDs key',
          armored: `-----BEGIN PGP PRIVATE KEY BLOCK-----

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
AN8G3r5Htj8olot+jm9mIa5XLXWzMNUZgg==
=aK4l
-----END PGP PRIVATE KEY BLOCK-----`,
          passphrase: 'correct horse battery staple',
          longid: '123',
        }
      });
      await SettingsPageRecipe.toggleScreen(settingsPage, 'additional');
      const myKeyFrame = await SettingsPageRecipe.awaitNewPageFrame(settingsPage, `@action-show-key-0`, ['my_key.htm', 'placement=settings']);
      await Util.sleep(1);
      await myKeyFrame.waitAll('@content-fingerprint');
      expect(await myKeyFrame.read('@content-fingerprint')).to.contain('61E8 C603 67CD B0EB');
      expect(await myKeyFrame.read('@content-emails')).to.contain('test@example.com');
      expect(await myKeyFrame.read('@content-emails')).to.contain('test-alias@example.com');
    }));

    ava.default('setup - recover with a pass phrase - skip remaining', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.compatibility@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1', { hasRecoverMore: true, clickRecoverMore: false });
    }));

    ava.default('setup - recover with a pass phrase - 1pp1 then 2pp1', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.compatibility@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1', { hasRecoverMore: true, clickRecoverMore: true });
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1');
    }));

    ava.default('setup - recover with a pass phrase - 1pp2 then 2pp1', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.compatibility@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp2', { hasRecoverMore: true, clickRecoverMore: true });
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1');
    }));

    ava.default('setup - recover with a pass phrase - 2pp1 then 1pp1', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.compatibility@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1', { hasRecoverMore: true, clickRecoverMore: true });
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1');
    }));

    ava.default('setup - recover with a pass phrase - 2pp1 then 1pp2', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.compatibility@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1', { hasRecoverMore: true, clickRecoverMore: true });
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp2');
    }));

    ava.default('setup - recover with a pass phrase - 1pp1 then 1pp2 (shows already recovered), then 2pp1', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.compatibility@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp1', { hasRecoverMore: true, clickRecoverMore: true });
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.1pp2', { alreadyRecovered: true });
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.compatibility.2pp1', {});
    }));

    ava.todo('setup - recover with a pass phrase - 1pp1 then wrong, then skip');
    // ava.default('setup - recover with a pass phrase - 1pp1 then wrong, then skip', test_with_browser(async (t, browser) => {
    //   const settingsPage = await BrowserRecipe.open_settings_login_approve(t, browser,'flowcrypt.compatibility@gmail.com');
    //   await SetupPageRecipe.setup_recover(settingsPage, 'flowcrypt.compatibility.1pp1', {has_recover_more: true, click_recover_more: true});
    //   await SetupPageRecipe.setup_recover(settingsPage, 'flowcrypt.wrong.passphrase', {wrong_passphrase: true});
    //   await Util.sleep(200);
    // }));

    ava.default('setup - recover with a pass phrase - no remaining', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.recovered@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.test.key.recovered', { hasRecoverMore: false });
    }));

    ava.default('setup - fail to recover with a wrong pass phrase', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.recovered@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.wrong.passphrase', { hasRecoverMore: false, wrongPp: true });
    }));

    ava.default('setup - fail to recover with a wrong pass phrase at first, then recover with good pass phrase', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.recovered@gmail.com');
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.wrong.passphrase', { wrongPp: true });
      await SetupPageRecipe.recover(settingsPage, 'flowcrypt.test.key.recovered');
    }));

    // ava.default.failing('setup - import key - submit - offline - retry', testWithBrowser(undefined, async (t, browser) => {
    //   // puppeteer seems to ignore `.setOfflineMode(true)` for localhost
    //   // don't want to start using non-localhost local host to avoid setup complications and keep tests straight forward
    //   // so for now disabling, hopefully future versions will fix this, in which case this failing test should start failing CI (because it will start passing)
    //   // an alternative solution could be to be able to dynamically switch mock settings to start/stop responding to a request (instead of setting puppeteer off/on line)
    //   const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'flowcrypt.test.key.used.pgp@gmail.com');
    //   await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp', { submitPubkey: true, usedPgpBefore: true, simulateRetryOffline: true });
    // }));

    ava.default('has.pub@org-rules-test - no backup, no keygen', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'has.pub@org-rules-test.flowcrypt.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'has.pub.orgrulestest', { noPrvCreateOrgRule: true, enforceAttesterSubmitOrgRule: true });
      await settingsPage.waitAll(['@action-show-encrypted-inbox', '@action-open-security-page']);
      await Util.sleep(1);
      await settingsPage.notPresent(['@action-open-backup-page']);
    }));

    ava.default('no.pub@org-rules-test - no backup, no keygen, enforce attester submit with submit err', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'no.pub@org-rules-test.flowcrypt.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'no.pub.orgrulestest', { noPrvCreateOrgRule: true, enforceAttesterSubmitOrgRule: true, fillOnly: true });
      await settingsPage.waitAndClick('@input-step2bmanualenter-save');
      await settingsPage.waitAll(['@container-overlay-prompt-text', '@action-overlay-retry']);
      const renderedErr = await settingsPage.read('@container-overlay-prompt-text');
      expect(renderedErr).to.contain(`Failed to submit to Attester`);
      expect(renderedErr).to.contain(`Could not find LDAP pubkey on a LDAP-only domain for email no.pub@org-rules-test.flowcrypt.com on server keys.flowcrypt.com`);
    }));

    ava.default('user@no-submit-org-rule.flowcrypt.com - do not submit to attester', testWithBrowser(undefined, async (t, browser) => {
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, 'user@no-submit-org-rule.flowcrypt.com');
      await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp', { noPubSubmitRule: true });
      await SettingsPageRecipe.toggleScreen(settingsPage, 'additional');
      const attesterFrame = await SettingsPageRecipe.awaitNewPageFrame(settingsPage, '@action-open-attester-page', ['keyserver.htm']);
      await attesterFrame.waitAndClick('@action-submit-pub');
      await attesterFrame.waitAndRespondToModal('error', 'confirm', 'Disallowed by your organisation rules');
    }));

    ava.default('user@no-search-domains-org-rule.flowcrypt.com - do not search attester for recipients on particular domains', testWithBrowser(undefined, async (t, browser) => {
      // disallowed searching attester for pubkeys on "flowcrypt.com" domain
      // below we search for human@flowcrypt.com which normally has pubkey on attester, but none should be found due to the rule
      const acct = 'user@no-search-domains-org-rule.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await SetupPageRecipe.manualEnter(settingsPage, 'flowcrypt.test.key.used.pgp');
      const composePage = await ComposePageRecipe.openStandalone(t, browser, acct);
      await ComposePageRecipe.fillMsg(composePage, { to: 'mock.only.pubkey@flowcrypt.com,mock.only.pubkey@other.com' }, 'flowcrypt domain should not be found');
      await composePage.waitForContent('.email_address.no_pgp', 'mock.only.pubkey@flowcrypt.com');
      await composePage.waitForContent('.email_address.has_pgp', 'mock.only.pubkey@other.com');
      await composePage.waitAll('@input-password');
    }));

    ava.default('get.key@key-manager-autogen.flowcrypt.com - automatic setup with key found on key manager', testWithBrowser(undefined, async (t, browser) => {
      const acct = 'get.key@key-manager-autogen.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await SetupPageRecipe.autoKeygen(settingsPage);
      await SettingsPageRecipe.toggleScreen(settingsPage, 'additional');
      // check no "add key"
      await settingsPage.notPresent('@action-open-add-key-page');
      // check imported key
      const myKeyFrame = await SettingsPageRecipe.awaitNewPageFrame(settingsPage, `@action-show-key-0`, ['my_key.htm', 'placement=settings']);
      await Util.sleep(1);
      await myKeyFrame.waitAll('@content-fingerprint');
      expect(await myKeyFrame.read('@content-fingerprint')).to.contain('00B0 1158 0796 9D75');
      await SettingsPageRecipe.closeDialog(settingsPage);
      await Util.sleep(2);
      // check that it does not offer any pass phrase options
      await SettingsPageRecipe.toggleScreen(settingsPage, 'basic');
      const securityFrame = await SettingsPageRecipe.awaitNewPageFrame(settingsPage, '@action-open-security-page', ['security.htm', 'placement=settings']);
      await Util.sleep(1);
      await securityFrame.notPresent(['@action-change-passphrase-begin', '@action-test-passphrase-begin', '@action-forget-pp']);
    }));

    ava.default('put.key@key-manager-autogen.flowcrypt.com - automatic setup with key not found on key manager, then generated', testWithBrowser(undefined, async (t, browser) => {
      const acct = 'put.key@key-manager-autogen.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await SetupPageRecipe.autoKeygen(settingsPage);
      await SettingsPageRecipe.toggleScreen(settingsPage, 'additional');
      // check no "add key"
      await settingsPage.notPresent('@action-open-add-key-page');
      // check imported key
      const myKeyFrame = await SettingsPageRecipe.awaitNewPageFrame(settingsPage, `@action-show-key-0`, ['my_key.htm', 'placement=settings']);
      await Util.sleep(1);
      await myKeyFrame.waitAll('@content-fingerprint');
      const fromKm = MOCK_KM_LAST_INSERTED_KEY[acct];
      expect(fromKm).to.exist;
      expect(await myKeyFrame.read('@content-fingerprint')).to.equal(Str.spaced(fromKm.fingerprint));
      expect(await myKeyFrame.read('@content-key-expiration')).to.equal('Key does not expire');
      await SettingsPageRecipe.closeDialog(settingsPage);
      await Util.sleep(2);
      // check that it does not offer any pass phrase options
      await SettingsPageRecipe.toggleScreen(settingsPage, 'basic');
      const securityFrame = await SettingsPageRecipe.awaitNewPageFrame(settingsPage, '@action-open-security-page', ['security.htm', 'placement=settings']);
      await Util.sleep(1);
      await securityFrame.notPresent(['@action-change-passphrase-begin', '@action-test-passphrase-begin', '@action-forget-pp']);
    }));

    ava.default('get.error@key-manager-autogen.flowcrypt.com - handles error during KM key GET', testWithBrowser(undefined, async (t, browser) => {
      const acct = 'get.error@key-manager-autogen.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await SetupPageRecipe.autoKeygen(settingsPage, {
        expectErr: {
          title: 'Server responded with an unexpected error.',
          text: '500 when GET-ing http://localhost:8001/flowcrypt-email-key-manager/keys/private (no body): -> Intentional error for get.error to test client behavior',
        }
      });
    }));

    ava.default('put.error@key-manager-autogen.flowcrypt.com - handles error during KM key PUT', testWithBrowser(undefined, async (t, browser) => {
      const acct = 'put.error@key-manager-autogen.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await settingsPage.waitAll(['@action-overlay-retry', '@container-overlay-prompt-text', '@action-show-overlay-details']);
      await Util.sleep(0.5);
      expect(await settingsPage.read('@container-overlay-prompt-text')).to.contain('Server responded with an unexpected error.');
      await settingsPage.click('@action-show-overlay-details');
      await settingsPage.waitAll('@container-overlay-details');
      await Util.sleep(0.5);
      const details = await settingsPage.read('@container-overlay-details');
      expect(details).to.contain('500 when PUT-ing http://localhost:8001/flowcrypt-email-key-manager/keys/private string: decryptedPrivateKey,publicKey,fingerprint -> Intentional error for put.error user to test client behavior');
      expect(details).to.not.contain('PRIVATE KEY');
      expect(details).to.not.contain('<REDACTED:');
    }));

    ava.default('fail@key-manager-server-offline.flowcrypt.com - shows friendly KM not reachable error', testWithBrowser(undefined, async (t, browser) => {
      const acct = 'fail@key-manager-server-offline.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await SetupPageRecipe.autoKeygen(settingsPage, {
        expectErr: {
          title: 'Network connection issue.',
          text: 'FlowCrypt Email Key Manager at https://localhost:1230/intentionally-wrong is down, please inform your network admin.',
        }
      });
    }));

    ava.default('user@key-manager-no-pub-lookup.flowcrypt.com - do not search pubkeys on EKM: NO_KEY_MANAGER_PUB_LOOKUP', testWithBrowser(undefined, async (t, browser) => {
      // disallowed searching EKM pubkeys (EKM is behind firewall, but user may be using public interned, with EKM not reachable)
      const acct = 'user@key-manager-no-pub-lookup.flowcrypt.com';
      const dontLookupEmail = 'not.suppposed.to.lookup@key-manager-no-pub-lookup.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await SetupPageRecipe.autoKeygen(settingsPage);
      const composePage = await ComposePageRecipe.openStandalone(t, browser, acct);
      await ComposePageRecipe.fillMsg(composePage, { to: dontLookupEmail }, 'must skip EKM lookup');
      await composePage.waitForContent('.email_address.no_pgp', dontLookupEmail); // if it tried EKM, this would be err
      await composePage.waitAll('@input-password');
    }));

    ava.default('expire@key-manager-keygen-expiration.flowcrypt.com - OrgRule enforce_keygen_expire_months: 1', testWithBrowser(undefined, async (t, browser) => {
      const acct = 'expire@key-manager-keygen-expiration.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await SetupPageRecipe.autoKeygen(settingsPage);
      await SettingsPageRecipe.toggleScreen(settingsPage, 'additional');
      const myKeyFrame = await SettingsPageRecipe.awaitNewPageFrame(settingsPage, `@action-show-key-0`, ['my_key.htm', 'placement=settings']);
      await Util.sleep(1);
      await myKeyFrame.waitAll('@content-fingerprint');
      const fromKm = MOCK_KM_LAST_INSERTED_KEY[acct];
      expect(fromKm).to.exist;
      expect(await myKeyFrame.read('@content-fingerprint')).to.equal(Str.spaced(fromKm.fingerprint));
      const approxMonth = [29, 30, 31].map(days => Str.datetimeToDate(Str.fromDate(new Date(Date.now() + 1000 * 60 * 60 * 24 * days))));
      expect(await myKeyFrame.read('@content-key-expiration')).to.be.oneOf(approxMonth);
      await SettingsPageRecipe.closeDialog(settingsPage);
    }));

    ava.default('reject.client.keypair@key-manager-autogen.flowcrypt.com - does not leak sensitive info on err 400, shows informative err', testWithBrowser(undefined, async (t, browser) => {
      const acct = 'reject.client.keypair@key-manager-autogen.flowcrypt.com';
      const settingsPage = await BrowserRecipe.openSettingsLoginApprove(t, browser, acct);
      await settingsPage.waitAll(['@action-overlay-retry', '@container-overlay-prompt-text', '@action-show-overlay-details']);
      await Util.sleep(0.5);
      const title = await settingsPage.read('@container-overlay-prompt-text');
      expect(title).to.contain('Failed to store newly generated key on FlowCrypt Email Key Manager, No key has been generated for reject.client.keypair@key-manager-autogen.flowcrypt.com yet. Please ask your administrator.');
      await settingsPage.click('@action-show-overlay-details');
      await settingsPage.waitAll('@container-overlay-details');
      await Util.sleep(0.5);
      const details = await settingsPage.read('@container-overlay-details');
      expect(details).to.contain('400 when PUT-ing http://localhost:8001/flowcrypt-email-key-manager/keys/private string: decryptedPrivateKey,publicKey,fingerprint -> No key has been generated for reject.client.keypair@key-manager-autogen.flowcrypt.com yet');
      expect(details).to.not.contain('PRIVATE KEY');
      expect(details).to.contain('<REDACTED:PRV>');
    }));

  }

};
