/* © 2016-2018 FlowCrypt Limited. Limitations apply. Contact human@flowcrypt.com */

'use strict';

tool.catch.try( async () => {

  let url_params = Env.url_params(['account_email', 'embedded', 'parent_tab_id']);
  let account_email = Env.url_param_require.string(url_params, 'account_email');
  let parent_tab_id = Env.url_param_require.string(url_params, 'parent_tab_id');

  await Ui.passphrase_toggle(['passphrase_entry']);

  let [primary_ki] = await Store.keys_get(account_email, ['primary']);
  Settings.abort_and_render_error_if_keyinfo_empty(primary_ki, false);
  if (!primary_ki) {
    return; // added do_throw=false above + manually exiting here because security.htm can indeed be commonly rendered on setup page before setting acct up
  }

  if (url_params.embedded) {
    $('.change_passhrase_container, .title_container').css('display', 'none');
    $('.line').css('padding', '7px 0');
  }

  let on_default_expire_user_change = async () => {
    Ui.sanitize_render('.select_loader_container', Ui.spinner('green'));
    $('.default_message_expire').css('display', 'none');
    await Api.fc.account_update({default_message_expire: Number($('.default_message_expire').val())});
    window.location.reload();
  };

  let stored_passphrase = await Store.passphrase_get(account_email, primary_ki.longid, true);
  if (stored_passphrase === null) {
    $('#passphrase_to_open_email').prop('checked', true);
  }
  $('#passphrase_to_open_email').change(() => {
    $('.passhprase_checkbox_container').css('display', 'none');
    $('.passphrase_entry_container').css('display', 'block');
  });

  $('.action_change_passphrase').click(Ui.event.handle(() => Settings.redirect_sub_page(account_email, parent_tab_id, '/chrome/settings/modules/change_passphrase.htm')));

  $('.action_test_passphrase').click(Ui.event.handle(() => Settings.redirect_sub_page(account_email, parent_tab_id, '/chrome/settings/modules/test_passphrase.htm')));

  $('.confirm_passphrase_requirement_change').click(Ui.event.handle(async () => {
    if ($('#passphrase_to_open_email').is(':checked')) { // todo - forget pass all phrases, not just master
      let stored_passphrase = await Store.passphrase_get(account_email, primary_ki.longid);
      if ($('input#passphrase_entry').val() === stored_passphrase) {
        await Store.passphrase_save('local', account_email, primary_ki.longid, undefined);
        await Store.passphrase_save('session', account_email, primary_ki.longid, undefined);
        window.location.reload();
      } else {
        alert('Pass phrase did not match, please try again.');
        $('input#passphrase_entry').val('').focus();
      }
    } else { // save pass phrase
      let key = openpgp.key.readArmored(primary_ki.private).keys[0];
      if (await tool.crypto.key.decrypt(key, [$('input#passphrase_entry').val() as string]) === true) { // text input
        await Store.passphrase_save('local', account_email, primary_ki.longid, $('input#passphrase_entry').val() as string);
        window.location.reload();
      } else {
        alert('Pass phrase did not match, please try again.');
        $('input#passphrase_entry').val('').focus();
      }
    }
  }));

  $('.cancel_passphrase_requirement_change').click(() =>  window.location.reload());

  let storage = await Store.get_account(account_email, ['hide_message_password']);
  $('#hide_message_password').prop('checked', storage.hide_message_password === true);
  $('#hide_message_password').change(Ui.event.handle(async target => {
    await Store.set(account_email, {hide_message_password: $(target).is(':checked')});
    window.location.reload();
  }));

  let subscription = await Store.subscription();
  if (subscription.active) {
    Ui.sanitize_render('.select_loader_container', Ui.spinner('green'));
    try {
      let response = await Api.fc.account_update();
      $('.select_loader_container').text('');
      $('.default_message_expire').val(Number(response.result.default_message_expire).toString()).prop('disabled', false).css('display', 'inline-block');
      $('.default_message_expire').change(on_default_expire_user_change);
    } catch (e) {
      if (Api.error.is_auth_error(e)) {
        Ui.sanitize_render('.expiration_container', '(unknown: <a href="#">verify your device</a>)').find('a').click(Ui.event.handle(() => Settings.redirect_sub_page(account_email, parent_tab_id, '/chrome/elements/subscribe.htm', '&source=auth_error')));
      } else if (Api.error.is_network_error(e)) {
        Ui.sanitize_render('.expiration_container', '(network error: <a href="#">retry</a>)').find('a').click(() => window.location.reload()); // safe source
      } else {
        tool.catch.handle_exception(e);
        Ui.sanitize_render('.expiration_container', '(unknown error: <a href="#">retry</a>)').find('a').click(() => window.location.reload()); // safe source
      }
    }
  } else {
    $('.default_message_expire').val('3').css('display', 'inline-block');
    Ui.sanitize_append($('.default_message_expire').parent(), '<a href="#">upgrade</a>').find('a').click(Ui.event.handle(() => Settings.redirect_sub_page(account_email, parent_tab_id, '/chrome/elements/subscribe.htm')));
  }

})();
