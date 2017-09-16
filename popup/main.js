/* globals configuration, Clipboard, aes, cookieManager, t */

(function() {
  'use strict'

  // Easy access to log functions to be disabled on build
  let log = console.log.bind(console, '[ShareSafe]')


  // --------------------------------------------------------------------
  // Main objects

  let template = {
    render: function(name, data) {
      log('[Template] Rendering', name,' with data', data)

      let template = this.get(name)
      document.getElementById('app').innerHTML = template.render(data || {})
      events.attach(name)
    },

    get: function(name) {
      let id = 'js-template-' + name
      let templateEl = document.getElementById(id)
      if (! templateEl) throw new Error('Whoops! template ' + id + ' does not exist')

      return new t(templateEl.innerHTML)
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

      addEventListener('#js-share-session-btn', 'click', function() {
        configuration.get('password', function(password) {
          if (! password) return

          session.store(password, function(encryptedData) {
            let sharedSession = show('js-shared-session')
            sharedSession.querySelector('pre').innerHTML = encryptedData
          })
        })
      })

      addEventListener('#js-session-hide', 'click', () => hide('js-shared-session'))

      new Clipboard('[data-clipboard]')
        .on('success', function(event) {
          flash(event.trigger, 'innerHTML', 'Copied!')
          event.clearSelection()
        })

      this['attach-password']() // Password related events are inside the Share section
    },

    'attach-password': function() {
      log('[Events] Attaching Password events')

      addEventListener('#js-toggle-password-visible', 'click', function(event) {
        let passwordInput = document.querySelector('input[name="password"]')

        passwordInput.type = {
          password: 'text',
          text    : 'password'
        }[passwordInput.type]

        event.currentTarget.classList.toggle('active')
      })

      addEventListener('#js-save-password-form', 'submit', function(event) {
        let formData = new FormData(event.currentTarget)
        let password = formData.get('password')

        configuration.set({ password })
        template.render('share', { password })

        flash(document.getElementById('js-save-password'), 'value', '✔')
      })
    },

    'attach-restore': function() {
      log('[Events] Attaching Restore events')

      addEventListener('#js-restore-session', 'submit', function(event) {
        let formData = new FormData(event.currentTarget)
        let data = formData.get('data')
        let password = formData.get('password')

        session.restore(data, password)
        event.currentTarget.reset()
      })
    },

    'attach-history': function() {
      addEventListener('.js-delete', 'click', function(event) {
        let key = event.currentTarget.dataset.key
        session.remove(key, () => fullRender('history'))
      })
    },

    attachGoBack: function() {
      addEventListener('.js-go-back', 'click', () => template.render('menu'))
    }
  }

  let session = {
    store: function(password, callback) {
      getCurrentTab(function(tab) {
        cookieManager.get(tab.url, function(cookies) {
          let data = { url: tab.url, cookies }
          let encryptedData = aes.encrypt(data, password)

          session.record(tab.url, tab.title)
          callback(encryptedData)
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

    restore: function(data, password) {
      let { url, cookies } = aes.decrypt(data, password)

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

  function flash(element, prop, value) {
    let originalValue = element[prop]
    element[prop] = value
    setTimeout(() => element[prop] = originalValue, 1000)
  }

  function show(id) {
    let el = document.getElementById(id)
    el.classList.remove('hidden')
    return el
  }

  function hide(id) {
    let el = document.getElementById(id)
    el.classList.add('hidden')
    return el
  }

  function isEmptyObject(obj) {
    return Object.keys(obj).length === 0
  }


  // --------------------------------------------------------------------
  // Start

  template.render('menu')

})()

