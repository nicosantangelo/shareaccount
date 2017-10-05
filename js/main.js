(function() {
  var installButton = document.getElementById('js-install-button')

  if (chrome.app.isInstalled) {
    installButton.innerHTML = 'INSTALLED, THANKS!'
    installButton.className += ' installed-button'

  } else {
    installButton.addEventListener('click', function(event) {
      var href = this.href

      event.preventDefault()

      chrome.webstore.install(href, function() {}, function() {
        console.log('Whops, inline install failed, continue with default link')
        window.location = href
      })
    }, false)
  }

  var timeoutId = null
  var DURATION = 550

  var siema = new Siema({
    selector: '.siema',
    duration: DURATION,
    easing: 'ease-out',
    perPage: 1,
    startIndex: 0,
    draggable: true,
    multipleDrag: true,
    threshold: 20,
    loop: true,
    onInit: function() {},
    onChange: function() {
      clearTimeout(timeoutId)
    }
  });

  function autoloop() {
    timeoutId = setTimeout(function() {
      siema.next()
      setTimeout(autoloop, DURATION)
    }, 3000)
  }

  autoloop()

  document.getElementById('js-prev').addEventListener('click', function() { siema.prev() })
  document.getElementById('js-next').addEventListener('click', function() { siema.next() })
})()
