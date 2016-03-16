'use strict';

function get_url_params(expected_keys, string) {
  var raw_url_data = (string || window.location.search.replace('?', '')).split('&');
  var url_data = {};
  $.each(raw_url_data, function(i, pair_string) {
    var pair = pair_string.split('=');
    if(expected_keys.indexOf(pair[0]) !== -1) {
      url_data[pair[0]] = decodeURIComponent(pair[1]);
    }
  });
  return url_data;
}

function open_settings_page(page) {
  window.open(chrome.extension.getURL('chrome/settings/' + (page || 'index.htm')), 'cryptup');
}

function is_email_valid(email) {
  return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i.test(email);
}

function get_account_emails(callback) {
  account_storage_get(null, ['account_emails'], function(storage) {
    var account_emails = [];
    if(typeof storage['account_emails'] !== 'undefined') {
      account_emails = JSON.parse(storage['account_emails']);
    }
    callback(account_emails);
  });
}

function for_each_known_account_email(callback) {
  get_account_emails(function(account_emails) {
    $.each(account_emails, function(i, account_email) {
      callback(account_emails[i]);
    });
  });
}

function add_account_email_to_list_of_accounts(account_email, callback) { //todo: concurrency issues with another tab loaded at the same time
  get_account_emails(function(account_emails) {
    if(account_emails.indexOf(account_email) === -1) {
      account_emails.push(account_email);
      account_storage_set(null, {
        'account_emails': JSON.stringify(account_emails)
      }, callback);
    } else if(typeof callback !== 'undefined') {
      callback();
    }
  });
}

function get_spinner() {
  return '&nbsp;<i class="fa fa-spinner fa-spin"></i>&nbsp;';
}

function random_string(length) {
  var id = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for(var i = 0; i < (length || 5); i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return id;
}

function array_without_key(array, i) {
  return array.splice(0, i).concat(array.splice(i + 1, array.length));
}

function array_without_value(array, without_value) {
  var result = [];
  $.each(array, function(i, value) {
    if(value !== without_value) {
      result.push(value);
    }
  });
  return result;
}

function extract_key_ids(armored_pubkey) {
  return openpgp.key.readArmored(armored_pubkey).keys[0].getKeyIds();
}

function key_ids_match(first, second) {
  if(first.length !== second.length) {
    return false;
  }
  for(var i = 0; i < first.length; i++) {
    if(first[i].bytes !== second[i].bytes) {
      return false;
    }
  }
  return true;
}

function check_pubkeys_message(account_email, message) {
  var message_key_ids = message.getEncryptionKeyIds();
  var local_key_ids = extract_key_ids(restricted_account_storage_get(account_email, 'master_public_key'));
  var diagnosis = {
    found_match: false,
    receivers: message_key_ids.length,
  };
  $.each(message_key_ids, function(i, msg_k_id) {
    $.each(local_key_ids, function(j, local_k_id) {
      if(msg_k_id === local_k_id) {
        diagnosis.found_match = true;
        return false;
      }
    });
  });
  return diagnosis;
}

function check_pubkeys_keyserver(account_email, callback) {
  var local_key_ids = extract_key_ids(restricted_account_storage_get(account_email, 'master_public_key'));
  var diagnosis = {
    has_pubkey_missing: false,
    has_pubkey_mismatch: false,
    results: {},
  };
  account_storage_get(account_email, ['addresses'], function(storage) {
    keyserver_keys_find(storage.addresses, function(success, pubkey_search_results) {
      if(success) {
        $.each(pubkey_search_results.results, function(i, pubkey_search_result) {
          if(!pubkey_search_result.pubkey) {
            diagnosis.has_pubkey_missing = true;
            diagnosis.results[pubkey_search_result.email] = {
              pubkey: null,
              pubkey_ids: null,
              match: null,
            }
          } else {
            var match = true;
            if(!key_ids_match(extract_key_ids(pubkey_search_result.pubkey), local_key_ids)) {
              diagnosis.has_pubkey_mismatch = true;
              match = false;
            }
            diagnosis.results[pubkey_search_result.email] = {
              pubkey: pubkey_search_result.pubkey,
              pubkey_ids: extract_key_ids(pubkey_search_result.pubkey),
              match: match,
            }
          }
        });
        callback(diagnosis);
      } else {
        callback();
      }
    });
  });
}

RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
/* -------------------- CHROME PLUGIN MESSAGING ----------------------------------- */

var background_script_shortcut_handlers = undefined;

function chrome_message_send(tab_id, name, data, callback) {
  var msg = {
    name: name,
    data: data,
    to: Number(tab_id) || null,
    respondable: (callback) ? true : false,
  };
  if(!background_script_shortcut_handlers) {
    chrome.runtime.sendMessage(msg, callback);
  } else { // calling from background script to background script: skip messaging completely
    background_script_shortcut_handlers[name](data, null, callback);
  }
}

function chrome_message_get_tab_id(callback) {
  chrome_message_send(null, '_tab_', null, callback);
}

function chrome_message_background_listen(handlers) {
  background_script_shortcut_handlers = handlers;
  chrome.runtime.onMessage.addListener(function(request, sender, respond) {
    handlers._tab_ = function(request, sender, respond) {
      respond(sender.tab.id);
    }
    if(request.to) {
      request.sender = sender;
      chrome.tabs.sendMessage(request.to, request, respond);
    } else {
      handlers[request.name](request.data, sender, respond);
    }
    return request.respondable === true;
  });
}

function chrome_message_listen(handlers) {
  chrome.runtime.onMessage.addListener(function(request, sender, respond) {
    handlers[request.name](request.data, sender, respond);
    return request.respondable === true;
  });
}

function base64url_encode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64url_decode(str) {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

function uint8_to_str(u8a) {
  var CHUNK_SZ = 0x8000;
  var c = [];
  for(var i = 0; i < u8a.length; i += CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
  }
  return c.join("");
}

function str_to_uint8(raw) {
  var rawLength = raw.length;
  var uint8 = new Uint8Array(new ArrayBuffer(rawLength));
  for(var i = 0; i < rawLength; i++) {
    uint8[i] = raw.charCodeAt(i);
  }
  return uint8;
}


/* -------------------- DOUBLE CLICK/PARALLEL PROTECTION FOR JQUERY ----------------------------------- */

var events_fired = {};
var DOUBLECLICK_MS = 1000;
var SPREE_MS = 50;

function doubleclick() {
  return {
    name: 'doubleclick',
    id: random_string(10),
  };
}

function parallel() {
  return {
    name: 'parallel',
    id: random_string(10),
  };
}

function spree() {
  return {
    name: 'spree',
    id: random_string(10),
  }
}

function prevent(meta, callback) { //todo: messy + needs refactoring
  return function() {
    if(meta.name === 'spree') {
      clearTimeout(events_fired[meta.id]);
      events_fired[meta.id] = setTimeout(callback, SPREE_MS);
    } else {
      if(meta.id in events_fired) {
        if(meta.name === 'parallel') {
          return; // id was found - means the event handling is still being processed. Do not call back
        } else if(meta.name === 'doubleclick') {
          if(Date.now() - events_fired[meta.id] > DOUBLECLICK_MS) {
            events_fired[meta.id] = Date.now();
            callback(this, meta.id);
          }
        }
      } else {
        events_fired[meta.id] = Date.now();
        callback(this, meta.id);
      }
    }
  }
}

function release(id) {
  if(id in events_fired) {
    var ms_to_release = DOUBLECLICK_MS + events_fired[id] - Date.now();
    if(ms_to_release > 0) {
      setTimeout(function() {
        delete events_fired[id];
      }, ms_to_release);
    } else {
      delete events_fired[id];
    }
  }
}
