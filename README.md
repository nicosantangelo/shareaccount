<p align="center">
  <img src="/popup/images/header-logo.png" width="150">
</p>

[Webstore](https://chrome.google.com/webstore/detail/shareaccount/glifngepkcmfolnojchcfiinmjgeablm)

### What?

Chrome Extension to share your account **without** giving out your **password**.

### Use

1. Ask the recipient for their code (found on the extension menu `RESTORE SESSION`) 
2. Go to the site from where you want to share the account and click the extension icon.
3. Press `SHARE SESSION` and enter the code
4. Press `SHARE` and copy the result.
5. Who only has to add it in the textbox of the `RESTORE SESSION` and press `RESTORE`

:tophat:
**Voilà**

### How it works?

The extension uses the Standford Javascript Crypto Lib implementation of EC-ElGamal. It generates a new public-private key combination for each extension upon frist use and uses it for encrypt/decrypt the session.

Appart for the keys, it doesn't store anything more than the URL/title of the sessions stored (to show them on the `SESSION HISTORY` menu).

If you want to be extra careful, you can always regenerate your keys on the extension.

