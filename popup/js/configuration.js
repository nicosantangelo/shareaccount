(function () {
  'use strict'

  var DEFAULT_CONFIGURATION = {
    publicKey: null,
    privateKey: null,

    sessions: {},        // { time: [{url, title}] }
    hasSessions: false
  }

  var configuration = {
    DEFAULT: DEFAULT_CONFIGURATION,

    forEachDefault: function(callback) {
      for(var prop in DEFAULT_CONFIGURATION) {
        callback(prop, DEFAULT_CONFIGURATION[prop])
      }
    },

    get: function(search, callback) {
      if (typeof search === 'function') {
        callback = search
        chrome.storage.local.get(DEFAULT_CONFIGURATION, callback)
      } else {
        chrome.storage.local.get(search, function(result) {
          let values = []
          let keys = {}

          if (typeof search === 'string') {
            keys[search] = null
          } else {
            keys = Object.assign({}, search)
          }

          values = Object.keys(keys).map(function(name) {
            return result[name] || DEFAULT_CONFIGURATION[name]
          })

          callback.apply(null, values)
        })
      }
    },

    set: function(values, callback) {
      chrome.storage.local.set(values, callback)
    },

    onChanged: function(callback) {
      chrome.storage.onChanged.addListener(function(changes, namespace) {
        callback(changes)
      })
    },

    forEachCurrent: function(callback) {
      configuration.get(function (config) {
        for(var prop in config) {
          callback(prop, config[prop])
        }
      })
    }
  }

  window.configuration = configuration
})()
