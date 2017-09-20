/* globals http */

(function() {
  'use strict'

  let log = window.log.bind('[ShareText]')

  const DELETE_TIMEOUT = 1000 * 60 * 10 // Ten minutes
  const PASTE_EE_API_KEY = ''

  const URL = 'https://api.paste.ee/v1/pastes?key=' + PASTE_EE_API_KEY


  const shareText = {
    getLink: function(title, text, success, error) {
      log('Request share link for', title)

      postJSON(this.getRequestData(title, text), function(response) {
        log('Success', response)
        success && success(response.link)
        setTimeout(function() { shareText.deleteLink(response.id) }, DELETE_TIMEOUT)
      },
      function(response) {
        log('Error', response)
        error && error(response)
      })
    },

    deleteLink: function(id) {
      log('Deleting link', id)

      postJSON({ id }, function() {
        log('Link', id, 'deleted')
      },
      function(response) {
        log('Error deleting link', id, response)
      })
    },

    getRequestData: function(title, text) {
      return {
        sections: [
          { name: title, contents: text }
        ]
      }
    }
  }


  function postJSON(data, success, error) {
    http({
      url: URL,
      method: 'POST',
      json: true,
      data,
      success,
      error
    })
  }


  window.shareText = shareText
})()
