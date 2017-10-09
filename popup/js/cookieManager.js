(function() {
  'use strict'

  const properties = [
    'name', 'domain', 'value', 'path', 'secure', 'httpOnly', 'expirationDate'
  ]

  const cookieManager = {
    get: function(url, callback) {
      chrome.cookies.getAll({ url }, function(cookies) {
        let newCookies = cookies.map(cookie => pick(cookie, properties))
        callback(newCookies)
      })
    },

    setExpirationDate: function(cookies, expirationTime) {
      const expirationDate = toUNIX(expirationTime || Date.now())

      return cookies.map(cookie => Object.assign(cookie, { expirationDate }))
    },

    set: function(url, cookies) {
      cookies.forEach(function(cookie) {
        let newCookie = Object.assign({ url }, pick(cookie, properties))
        chrome.cookies.set(newCookie)
      })
    }
  }


  function pick(base, properties) {
    let newObject = {}
    properties.forEach(key => newObject[key] = base[key])

    return newObject
  }

  function toUNIX(time) {
    return time / 1000
  }

  window.cookieManager = cookieManager
})()

