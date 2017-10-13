(function() {
  var installButtons = document.getElementsByClassName('js-install-button')

  for (var i = 0; i < installButtons.length; i++) {
    var installButton = installButtons[i]

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
  }
})()
