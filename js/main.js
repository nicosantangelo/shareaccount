(function() {
  var installButton = document.getElementById('js-install-button')

  if (chrome.app.isInstalled) {
    installButton.innerHTML = 'INSTALLED, THANKS!'
    installButton.className += ' installed-button'

  } else {
    installButton.addEventListener('click', function(event) {
      chrome.webstore.install(this.href, function() {
        event.preventDefault()
      }, function() {
        console.log('Whops, inline install failed, continue with default link')
      })
    }, false)
  }

  var timeoutId = null

  var siema = new Siema({
    selector: '.siema',
    duration: 550,
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
      autoloop()
    }, 3500)
  }

  autoloop()

  document.getElementById('js-prev').addEventListener('click', function() { siema.prev() })
  document.getElementById('js-next').addEventListener('click', function() { siema.next() })
})()
