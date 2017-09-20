/* globals CryptoJS */

(function() {
  'use strict'

  window.aes = {
    decrypt: function(data, password) {
      let decryptedData = CryptoJS.AES.decrypt(data, password)
      return JSON.parse(decryptedData.toString(CryptoJS.enc.Utf8))
    },

    encrypt: function(data, salt) {
      let encryptedData = JSON.stringify(data)
      return CryptoJS.AES.encrypt(encryptedData, salt).toString()
    }
  }
})()
