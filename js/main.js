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
        ga('send', 'event', 'Button', 'click', 'Install')
        window.location = href
      }, false)
    }
  }
})()
