/* globals configuration, aes, cookieManager, t */

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
        let clicked = event.currentTarget

        configuration.get('password', function(password) {
          template.render(clicked.dataset.menu, { password })
        })
      })
    },

    'attach-share': function() {
      log('[Events] Attaching Share events')

      addEventListener('#js-share-session-btn', 'click', function() {
        configuration.get('password', function(password) {
          if (! password) return

          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            let url = tabs[0].url

            cookieManager.get(url, function(cookies) {
              let sharedSession = show('js-shared-session')
              let data = { url, cookies }
              sharedSession.querySelector('pre').innerHTML = aes.encrypt(data, password)
            })
          })
        })
      })

      addEventListener('#js-session-hide', 'click', () => hide('js-shared-session'))

      addEventListener('#js-session-select', 'click', function() {
        let session = document.querySelector('#js-shared-session pre')
        let range   = document.createRange()
        range.selectNodeContents(session)

        let sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      })

      this['attach-password']() // Password related events are inside the Share section
    },

    'attach-password': function() {
      log('[Events] Attaching Password events')

      addEventListener('#js-toggle-password-visible', 'click', function(event) {
        let passwordInput = document.getElementById('js-set-password')[0]
        let type = passwordInput.type

        passwordInput.type = { password: 'text', text: 'password' }[type]
        event.currentTarget.classList.toggle('active')
      })

      addEventListener('#js-set-new-password', 'click', () =>
        document.getElementById('js-set-password').dispatchEvent(new CustomEvent('submit'))
      )

      addEventListener('#js-set-password', 'submit', function(event) {
        let formData = new FormData(event.currentTarget)
        let password = formData.get('password')

        configuration.set({ password })
        template.render('share', { password })

        let newPasswordLink = document.getElementById('js-set-new-password')
        newPasswordLink.innerHTML = '&#10004;'
        setTimeout(() => newPasswordLink.innerHTML = 'Save', 1000)
      })
    },

    'attach-restore': function() {
      log('[Events] Attaching Restore events')

      addEventListener('#js-restore-session', 'submit', function(event) {
        let formData = new FormData(event.currentTarget)
        let data = formData.get('data')
        let password = formData.get('password')

        event.currentTarget.reset()

        let { url, cookies } = aes.decrypt(data, password)

        cookieManager.set(url, cookies)
        chrome.tabs.create({ url })
      })
    },

    attachGoBack: function() {
      addEventListener('.js-go-back', 'click', function() {
        template.render('menu')
      })
    }
  }


  // --------------------------------------------------------------------
  // Utils

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


  // --------------------------------------------------------------------
  // Start

  template.render('menu')

})()

