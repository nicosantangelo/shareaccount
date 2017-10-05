/* globals http, cryptography, Base64, RawDeflate */

(function() {
  'use strict'

  const log = window.log.bind('[ShareText]')

  const BASE_URL = 'https://privatebin.net'
  const ENCRYPT_OPTIONS = { mode: 'gcm', ks: 256, ts: 128 }

  const shareText = {
    getLink: function(text, success, error) {
      log('Request share link')

      const secret = cryptography.randomkey()
      const encryption = this.encryptText(secret, text || '')

      this.requestLink(this.getRequestData(encryption), response => {
        log('Success', response)
        success && success(this.getPasteURL(secret, response.id))
      },
      response => {
        log('Error', response)
        error && error(response)
      })
    },

    requestLink(data, success, error) {
      // {status: 1, message: "Please wait 10 seconds between each post."}
      return postJSON(BASE_URL, data, response => {
        response = JSON.parse(response)

        if (response.status === 0) {
          success(response)
        } else if (response.message === 'Please wait 10 seconds between each post.') {
          setTimeout(() => this.requestLink(data, success, error), 10000)
        } else {
          error(response)
        }
      },
      response => error(response))
    },

    getRequestData: function(text) {
      return [
        `data=${encodeURIComponent(text)}`,
        'expire=10min',
        'formatter=plaintext',
        'burnafterreading=1',
        'opendiscussion=0'
      ].join('&')
    },

    getPasteURL: function(secret, id) {
      // https://privatebin.net/?SOME_ID#SOME_SECRET_KEY
      return `${BASE_URL}/?${id}#${secret}`
    },

    encryptText: function(secret, text) {
      return cryptography.encrypt(secret, this.compress(text), ENCRYPT_OPTIONS)
    },

    compress: function(text) {
      return Base64.toBase64( RawDeflate.deflate( Base64.utob(text) ) )
    }
  }


  function postJSON(url, data, success, error) {
    return sendJSON(url, data, 'POST', success, error)
  }

  function sendJSON(url, data, method, success, error) {
    http({
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept-Language': 'en-US',
        'X-Requested-With': 'JSONHttpRequest'
      },
      url,
      method,
      data,
      success,
      error
    })
  }


  window.shareText = shareText
})()
