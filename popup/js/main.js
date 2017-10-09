/* globals log, configuration, Clipboard, shareText, cryptography, cookieManager, _t */

(function() {
  'use strict'

  // --------------------------------------------------------------------
  // Main objects

  const template = {
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

  const events = {
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

      let expiresTimeoutId = null

      addEventListener('[name="timeout"]', 'keyup', function updateExpiresText(event) {
        clearTimeout(expiresTimeoutId)

        let expiresOn = getElementById('js-expires-on')
        let timeout = event.target.value

        if (timeout.trim()) {
          expiresOn.innerText = `Expires on: ${expires.getExpirationString(timeout)}`
          expiresTimeoutId = setTimeout(function() {
            updateExpiresText(event)
          }, 1000)
        } else {
          expiresOn.innerText = ''
        }
      })

      addEventListener('#js-share-session', 'submit', function() {
        try {
          let publicKey = getFormElement(this, 'pubkey').value
          let timeout = getFormElement(this, 'timeout').value

          let expirationTime = expires.getExpirationTime(timeout)

          session.store(publicKey, expirationTime, function(encryptedData, tab) {
            show('js-shared-session')

            getElementById('js-shared-session-text').innerHTML = encryptedData
            displayLink(encryptedData)
          })

        } catch(e) {
          console.warn(e)
          showError('An error occurred trying to encrypt your session. Check that the code is correct.')
        }
      })

      addEventListener('#js-session-hide', 'click', () => hide('js-shared-session'))

      addEventListener('#js-copy-share-text', 'click', () => hide('js-shared-session'))

      this.onTextSubmitted('[name="pubkey"]', function(textarea) {
        const submitButton = document.querySelector('input[name="submit"]')
        enableIfText(textarea.value, submitButton)
      })

      // --------------------------------------------------------------------
      // attach-share specific helpers

      function displayLink(encryptedData) {
        shareText.getLink(encryptedData,
          function success(link) {
            getElementById('js-share-text-link').innerHTML = link
            show('js-share-text-actions')
            window.scrollBy({ top: 500, left: 0, behavior: 'smooth' })
          },
          function error() {
            getElementById('js-share-text-link').innerHTML = 'Whops, couldn\'t get the link'
          }
        )
      }
    },

    'attach-restore': function() {
      log('[Events] Attaching Restore events')

      addEventListener('#js-regenerate-keys', 'click', function(event) {
        const { publicKey } = keys.generate()
        session.removeAll()

        getElementById('js-user-pubkey').value = publicKey
        flash(event.currentTarget, 'data-balloon', 'Restored!')
      })

      addEventListener('#js-restore-session', 'submit', function(event) {
        try {
          let textarea = getFormElement(event.currentTarget, 'encrypted-data')

          session.restore(textarea.value)
          event.currentTarget.reset()

        } catch(e) {
          console.warn(e)
          showError('An error occurred trying to restore the session. Check that the encrypted text is correct and was generated with your code.')
        }
      })

      this.onTextSubmitted('[name="encrypted-data"]', function(textarea) {
        const submitButton = document.querySelector('input[name="submit"]')
        enableIfText(textarea.value, submitButton)

        let notice = ''

        try {
          const { title, expirationTime } = session.decrypt(textarea.value)
          notice = `Restore "${title}" session.`

          if (expires.isExpired(expirationTime)) notice += '\nThe session seems to be expired!'

        } catch(e) {
          notice = ''
          console.warn(e)
        }

        getElementById('js-restore-notice').innerText = notice
      })
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

    onTextSubmitted: function(selector, callback) {
      addEventListener(selector, 'keyup', event => {
        callback(event.currentTarget)
      })

      addEventListener(selector, 'paste', event => {
        const pastedData = event.clipboardData.getData('Text')
        window.document.execCommand('insertText', false, pastedData)

        callback(event.currentTarget)
      })
    }
  }

  const session = {
    store: function(publicKey, expirationTime, callback) {
      this.getCurrent(function(tab, cookies) {
        let data = {
          url: tab.url,
          title: tab.title,
          cookies: cookieManager.setExpirationDate(cookies, expirationTime),
          expirationTime: expirationTime
        }

        const encryptedData = keys.encrypt(publicKey, data)

        session.record(tab.url, tab.title)
        callback(encryptedData, tab)
      })
    },

    getCurrent(callback) {
      getCurrentTab(function(tab) {
        cookieManager.get(tab.url, function(cookies) {
          return callback(tab, cookies)
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
      const { url, cookies } = this.decrypt(data)

      cookieManager.set(url, cookies)
      chrome.tabs.create({ url })
    },

    decrypt(data) {
      return keys.decrypt(data)
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

    getKey: function(timestamp) {
      return [
        timestamp.getMonth(),
        timestamp.getDate(),
        timestamp.getYear()
      ].join('/')
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

    getMonthFromKey: function(key) {
      return key.split('/')[0]
    }
  }

  const keys = {
    pair: {
      publicKey: null,
      privateKey: null,
    },

    upsert: function() {
      if (this.isGenerated()) return

      configuration.get(this.pair, function(publicKey, privateKey) {
        if (! publicKey || ! privateKey) {
          this.generate()
        } else {
          this.pair = { publicKey, privateKey }
        }

      }.bind(this))
    },

    generate: function() {
      log('Saving user keys for later signing')

      const pair = cryptography.createKeys()

      this.pair = pair
      configuration.set(pair)
      return this.pair
    },

    isGenerated: function() {
      return this.publicKey && this.privateKey
    },

    encrypt: function(publicKey, message) {
      const secret = cryptography.decodePublicKey(publicKey)
      return cryptography.encrypt(secret, JSON.stringify(message))
    },

    decrypt: function(encrypted) {
      const secret = cryptography.decodePrivateKey(this.pair.privateKey)
      const decryption = cryptography.decrypt(secret, encrypted)
      return JSON.parse(decryption)
    }
  }

  const expires = {
    DEFAULT: 7 * 24, // A week

    getExpirationTime(timeoutInHours) {
      timeoutInHours = this.isValidTimeout(timeoutInHours) ? timeoutInHours : this.DEFAULT

      return Date.now() + this.hoursToMs(timeoutInHours)
    },

    getExpirationString(timeout) {
      const expirationTime = this.getExpirationTime(timeout)
      return new Date(expirationTime).toLocaleString()
    },

    isExpired(time) {
      return Date.now() >= time
    },

    isValidTimeout(timeout) {
      return parseInt(timeout, 10) > 0
    },

    hoursToMs(hours) {
      return hours * 60 * 60 * 1000
    }
  }

  // --------------------------------------------------------------------
  // Utils

  function fullRender(name) {
    getCurrentTab(tab =>
      configuration.get(config =>
        template.render(name, Object.assign({ tab }, config))
      )
    )
  }

  function getCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      callback(tabs[0])
    })
  }

  function showError(text) {
    let errorEl = getElementById('js-error')
    errorEl.innerHTML = text
    flash(errorEl, 'className', 'error', 4500)
  }

  function addEventListener(selector, event, fn) {
    let els = document.querySelectorAll(selector)
    if (! els.length) log('[WARN] Could not find an element for selector ' + selector)

    for (let i = 0; i < els.length; i++) {
      els[i].addEventListener(event, preventDefault(fn), false)
    }
  }

  function getFormElement(form, name) {
    let elements = form.elements

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].name === name) {
        return elements[i]
      }
    }
  }

  function preventDefault(fn) {
    return function(event) {
      event.preventDefault()
      fn.call(this, event)
    }
  }

  function enableIfText(value, target) {
    if (value.trim()) {
      target.removeAttribute('disabled', false)
    } else {
      target.setAttribute('disabled', false)
    }
  }

  function flash(element, prop, value, delay) {
    const setVal = function(val) {
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

