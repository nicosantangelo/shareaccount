/* Globals: CryptoJS, configuration, t */ 

(function() {
  configuration.get('password', function(currentPassword) {
    render(currentPassword)
    addEvents()
  })

  function addEvents() {
    addEventListener('js-set-new-password', 'click', () =>
      document.getElementById('js-set-password').classList.remove('hidden')
    )
    
    addEventListener('js-set-password', 'submit', event => {
      let formData = new FormData(event.currentTarget)
      let password = formData.get('password')

      configuration.set({ password: password })
      render(password)
    })

    addEventListener('js-share-session', 'click', () => {
      configuration.get('password', function(currentPassword) {
        if (! currentPassword) {
          console.error('No sir')
          return
        }
          
        encryptCookies(currentPassword, encryptedData =>
          document.getElementById('js-shared-session').innerHTML = encryptedData
        )
      })
    })

    addEventListener('js-restore-session', 'submit', event => {
      let formData = new FormData(event.currentTarget)
      let data = formData.get('data')
      let password = formData.get('password')

      let decryptedData = CryptoJS.AES.decrypt(data, password).toString(CryptoJS.enc.Utf8)
      let { cookies, url } = JSON.parse(decryptedData)

      cookies.forEach(c => {
        let domain = c.domain[0] === '.' ? c.domain.slice(1) : c.domain

        let cookie = {
          url     : "http" + (c.secure ? "s" : "") + "://" + domain + c.path,
          name    : c.name,
          value   : c.value,
          path    : c.path,
          secure  : c.secure,
          httpOnly: c.httpOnly,
          storeId : c.storeId
        }
        c.hostOnly || (cookie.domain = c.domain)
        c.session || (cookie.expirationDate = c.expirationDate)

        chrome.cookies.set(cookie)
      })

      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        let { id } = tabs[0]
        chrome.tabs.update(id, { url })
      })
    })
  }

  function encryptCookies(salt, fn) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      let { url } = tabs[0]

      chrome.cookies.getAll({ url }, function(cookies) {
        let data = JSON.stringify({ cookies, url })
        let encryptedData = CryptoJS.AES.encrypt(data, salt).toString()
        fn(encryptedData)
      })
    })
  }

  // --------------------------------------------------------------------
  // Utils

  let template = new t(document.getElementById('js-template').innerHTML)

  function render(currentPassword) {
    document.getElementById('app').innerHTML = template.render({ currentPassword })
  }

  function addEventListener(id, event, fn) {
    document.getElementById(id).addEventListener(event, preventDefault(fn), false)
  }

  function preventDefault(fn) {
    return event => {
      event.preventDefault()
      fn(event)
    }
  }
})()
  
