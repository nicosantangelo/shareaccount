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
})()
