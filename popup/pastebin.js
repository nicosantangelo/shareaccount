/* globals http */

(function() {
  'use strict'

  let log = window.log.bind('[Pastebin]')

  const PASTEBIN_API_KEY = ''

  const data = [
    'api_option=paste&api_user_key=', // if an invalid or expired api_user_key is used, an error will spawn. If no api_user_key is used, a guest paste will be created
    '&api_paste_private=1',           // 0=public 1=unlisted 2=private
    '&api_paste_expire_date=10M',
    '&api_paste_format=text',
    '&api_dev_key=',
    PASTEBIN_API_KEY
  ]


  const shareText = {
    getLink: function(title, text, success, error) {
      log('Request link')

      http({
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        url: 'https://pastebin.com/api/api_post.php',
        data: this.getRequestData(title, text),
        success: function(response) {
          log('Success', response)
          success && success(response)
        },
        error: function(response) {
          log('Error', response)
          error && error(response)
        }
      })
    },

    getRequestData: function(title, text) {
      return data
        .concat([
          '&api_paste_name=',
          encodeURIComponent(title),
          '&api_paste_code=',
          encodeURIComponent(text),
        ])
        .join('')
    }
  }

  window.shareText = shareText
})()
