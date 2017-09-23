(function() {
  'use strict'

  window.http = function(options, success) {
    const xmlhttp = new XMLHttpRequest()

    xmlhttp.onreadystatechange = function(result) {
      if (xmlhttp.readyState === 4) {
        if(xmlhttp.status >= 400) {
          options.error && options.error(xmlhttp.responseText, xmlhttp)
        } else {
          const response = options.json ? JSON.parse(xmlhttp.responseText) : xmlhttp.responseText
          options.success && options.success(response, xmlhttp)
        }
      }
    }

    xmlhttp.open(options.method, options.url, true)

    if (options.json) {
      options.headers = options.headers || {}
      options.headers['Content-Type'] = 'application/json'
      options.data = JSON.stringify(options.data || null)
    }

    if (options.headers) {
      for(const header in options.headers) {
        xmlhttp.setRequestHeader(header, options.headers[header])
      }
    }

    xmlhttp.send(options.data)
  }

})()
