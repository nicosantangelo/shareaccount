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
    duration: 500,
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

  function autoloop(index) {
    if (index > 5) index = 0

    timeoutId = setTimeout(function() {
      siema.next()
      autoloop(index + 1)
    }, 2000 + (200 * index))
  }

  autoloop(0)
})()
