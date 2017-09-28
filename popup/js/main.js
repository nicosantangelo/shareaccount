/* globals log, configuration, Clipboard, shareText, cryptography, cookieManager, _t */

(function() {
  'use strict'

  // --------------------------------------------------------------------
  // Main objects

  let template = {
    render: function(name, data) {
      log('[Template] Rendering', name,' with data', data)

      let template = this.get(name)
      getElementById('app').innerHTML = template.render(data || {})
      events.attach(name)
    },

    get: function(name) {
      let id = 'js-template-' + name
      let templateEl = getElementById(id)
      if (! templateEl) throw new Error('Whoops! template ' + id + ' does not exist')

      return new _t(templateEl.innerHTML)
    }
  }

  let events = {
    attach: function(name, extra) {
      let attachName = 'attach-' + name

      if (this[attachName]) {
        this[attachName](extra)
      }

      this.attachGoBack()
    },

    'attach-menu': function() {
      log('[Events] Attaching Menu events')

      addEventListener('[data-menu]', 'click', function(event) {
        let menu = event.currentTarget.dataset.menu
        fullRender(menu)
      })
    },

    'attach-share': function() {
      log('[Events] Attaching Share events')

      addEventListener('#js-share-session', 'submit', function() {
        try {
          const publicKey = getElementById('js-pubkey').value

          session.store(publicKey, function(encryptedData, tab) {
            show('js-shared-session')
            getElementById('js-shared-session-text').innerHTML = encryptedData

            shareText.getLink(tab.title, encryptedData, link => getElementById('js-share-text-link').innerHTML = link)
          })

        } catch(e) {
          console.warn(e)
          showError('An error occurred trying to encrypt your session. Check that the code is correct.')
        }
      })

      addEventListener('#js-session-hide', 'click', () => hide('js-shared-session'))

      addEventListener('#js-copy-share-text', 'click', () => hide('js-shared-session'))

      this.attachConditionalSubmitEvents({ source: 'pubkey', target: 'submit' })
    },

    'attach-restore': function() {
      log('[Events] Attaching Restore events')

      addEventListener('#js-restore-session', 'submit', function(event) {
        try {
          let form = event.currentTarget
          let textarea = form.elements[0]

          session.restore(textarea.value)
          event.currentTarget.reset()

        } catch(e) {
          console.warn(e)
          showError('An error occurred trying to restore the session. Check that the encrypted text is correct and was generated with your code.')
        }
      })

      addEventListener('#js-regenerate-keys', 'click', function(event) {
        keys.generate()
        session.removeAll()
        fullRender('restore')
      })

      this.attachConditionalSubmitEvents({ source: 'data', target: 'submit' })
    },

    'attach-history': function() {
      log('[Events] Attaching History events')

      addEventListener('.js-delete', 'click', function(event) {
        let key = event.currentTarget.dataset.key
        session.remove(key, () => fullRender('history'))
      })
    },

    attachClipboard: function() {
      log('[Events] Attaching clipboard')

      new Clipboard('[data-clipboard]')
        .on('success', function(event) {
          flash(event.trigger, 'data-balloon', 'Copied!')
          event.clearSelection()
        })
    },

    attachGoBack: function() {
      log('[Events] Attaching go back')
      addEventListener('.js-go-back', 'click', () => template.render('menu'))
    },

    attachConditionalSubmitEvents: function(names) {
      const sourceSelector = '[name="' + names.source + '"]'
      const target = document.querySelector('input[name="' + names.target + '"]')

      addEventListener(sourceSelector, 'keyup', event => enableOnText(event.currentTarget, target))

      addEventListener(sourceSelector, 'paste', event => {
        const pastedData = event.clipboardData.getData('Text')

        window.document.execCommand('insertText', false, pastedData)
        enableOnText(event.currentTarget, target)
      })
    }
  }

  let session = {
    store: function(publicKey, callback) {
      getCurrentTab(function(tab) {
        cookieManager.get(tab.url, function(cookies) {
          let data = { url: tab.url, cookies }
          let encryptedData = keys.encrypt(publicKey, data)

          session.record(tab.url, tab.title)
          callback(encryptedData, tab)
        })
      })
    },

    record: function(url, title) {
      session.modify(function(sessions) {
        let timestamp = new Date()
        let sessionKey = session.getKey(timestamp)

        sessions[sessionKey] = sessions[sessionKey] || []
        sessions[sessionKey].push({
          url,
          title,
          timestamp: timestamp.getTime()
        })

        return session.filterOlderKeys(sessions)
      })
    },

    restore: function(data) {
      let { url, cookies } = keys.decrypt(data)

      cookieManager.set(url, cookies)
      chrome.tabs.create({ url })
    },

    filterOlderKeys: function(sessions) {
      let currentMonth = new Date().getMonth()
      let filteredSessions = {}

      for (let key in sessions) {
        let month = this.getMonthFromKey(key)

        if (currentMonth == month) {
          filteredSessions[key] = sessions[key]
        }
      }

      return filteredSessions
    },

    removeAll: function(key) {
      session.modify(function() { return {} })
    },

    remove: function(key, callback) {
      session.modify(function(sessions) {
        delete sessions[key]
        return sessions
      }, callback)
    },

    modify: function(modifier, callback) {
      configuration.get('sessions', function(sessions) {
        sessions = modifier(sessions)
        configuration.set({ sessions, hasSessions: ! isEmptyObject(sessions) })

        callback && callback()
      })
    },

    getKey(timestamp) {
      return [
        timestamp.getMonth(),
        timestamp.getDate(),
        timestamp.getYear()
      ].join('/')
    },

    getMonthFromKey(key) {
      return key.split('/')[0]
    }
  }

  const keys = {
    pair: {
      publicKey: null,
      privateKey: null,
    },

    upsert() {
      if (this.isGenerated()) return

      configuration.get(this.pair, function(publicKey, privateKey) {
        if (! publicKey || ! privateKey) {
          this.generate()
        } else {
          this.pair = { publicKey, privateKey }
        }

      }.bind(this))
    },

    generate() {
      log('Saving user keys for later signing')

      const pair = cryptography.createKeys()

      this.pair = pair
      configuration.set(pair)
    },

    isGenerated() {
      return this.publicKey && this.privateKey
    },

    encrypt(publicKey, message) {
      return cryptography.encrypt(publicKey, JSON.stringify(message))
    },

    decrypt(encrypted) {
      const decryption = cryptography.decrypt(this.pair.privateKey, encrypted)
      return JSON.parse(decryption)
    }
  }


  // --------------------------------------------------------------------
  // Utils

  function fullRender(name) {
    configuration.get(config => template.render(name, config))
  }

  function getCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      callback(tabs[0])
    })
  }

  function showError(text) {
    const errorEl = getElementById('js-error')
    flash(errorEl, 'innerHTML', text, 4500)
  }

  function addEventListener(selector, event, fn) {
    let els = document.querySelectorAll(selector)
    if (! els.length) log('[WARN] Could not find an element for selector ' + selector)

    for (let i = 0; i < els.length; i++) {
      els[i].addEventListener(event, preventDefault(fn), false)
    }
  }

  function preventDefault(fn) {
    return event => {
      event.preventDefault()
      fn(event)
    }
  }

  function enableOnText(input, target) {
    if (input.value.trim()) {
      target.removeAttribute('disabled', false)
    } else {
      target.setAttribute('disabled', false)
    }
  }

  function flash(element, prop, value, delay) {
    let setVal = function(val) {
      if (element[prop] === undefined) {
        element.setAttribute(prop, val)
      } else {
        element[prop] = val
      }
    }

    let originalValue = element[prop] || element.getAttribute(prop)
    setVal(value)
    setTimeout(() => setVal(originalValue), delay || 1000)
  }

  function show(id) {
    let el = getElementById(id)
    el.classList.remove('hidden')
    return el
  }

  function hide(id) {
    let el = getElementById(id)
    el.classList.add('hidden')
    return el
  }

  function getElementById(id) {
    return document.getElementById(id)
  }

  function isEmptyObject(obj) {
    return Object.keys(obj).length === 0
  }




  // --------------------------------------------------------------------
  // Start

  keys.upsert()

  template.render('menu')
  events.attachClipboard()
})()

