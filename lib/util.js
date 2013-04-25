//     util.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Various utility functions

var util = {
  
  // Whether we support Chrome yet
  chromeCompatible: true,
  
  // Whether we support Firefox yet
  firefoxCompatible: false,
  
  // Chrome version required for support
  chromeVersion: 26,
  
  // Firefox version required for support
  firefoxVersion: 22,

  // Whether we are in debug mode
  debug: true,
  
  // URL to render.html
  RENDER_HTML_URL: 'render.html',
  
  // Sumologic counter URL
  COUNTER_URL: 'https://collectors.sumologic.com/receiver/v1/http/ZaVnC4dhaV35KSlERGtg26eWXoZ0NjpvrPPIYs3FqYwz4CSR-mWnYrnc8kciNLii4sLppgZQrA5l-az6Y0rRT2FGVhWipeqRlQ02XmYyodZnNIW5afa_kw==',
  
  // OOP inheritance function as provided by the Node.js util library
  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  
  // Shallow extend functions as provided by the Node.js util library
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  
  // Binary packing function
  pack: BinaryPack.pack,
  
  // Binary unpacking functionlk
  unpack: BinaryPack.unpack,

  // Logging function, logs only if debug flag is true
  log: function () {
    if (util.debug) {
      var err = false;
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift('PJS: ');
      for (var i = 0, l = copy.length; i < l; i++){
        if (copy[i] instanceof Error) {
          copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
          err = true;
        }
      }
      err ? console.error.apply(console, copy) : console.log.apply(console, copy);
    }
  },

  // Runs a callback at end of event queue, optimized for performance using postMessage
  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }		

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(this)),
  
  // Converts a Blob to ArrayBuffer
  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  
  // Converts a Blob to a string encoding
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  
  // Converts a string to its ArrayBuffer representation
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  
  // Generate a random token
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  },
  
  // Retrieve a normalized absolute URL
  absoluteURL: function(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser.href;
  },
  
  // Check if browser version matches the required versions
  isBrowserCompatible: function() {
    var c, f;
    if (this.chromeCompatible) {
      if ((c = navigator.userAgent.split('Chrome/')) && c.length > 1) {
        var v = c[1].split('.')[0];
        return parseInt(v) >= this.chromeVersion;
      }
    }
    if (this.firefoxCompatible) {
      if ((f = navigator.userAgent.split('Firefox/')) && f.length > 1) {
        var v = f[1].split('.')[0];
        return parseInt(v) >= this.firefoxVersion;
      }
    }
    return false;
  },
  
  xhrFile: function(url, cb, binary) {
    var http = new XMLHttpRequest();
    http.open('get', url, true);
    if (binary) {
      http.responseType = "blob"; 
    }
    http.onload = function(e) {
      var d = new Date(http.getResponseHeader('expires'));
      cb(http.status, http.response, d.getTime(), url);
    }
    http.send(null);
  },
  
  htmlToBlobUrl: function(html) {
    var blob = new Blob([html], {type: 'text/html'});
    return URL.createObjectURL(blob);
  },
  
  renderUrl: function() {
    var html = localStorage.getItem('RENDER_HTML');
    if (html === null) {
      util.xhrFile(util.RENDER_HTML_URL, function(status, resp){
        if (status == 200) {
          localStorage.setItem('RENDER_HTML', resp);
          var url = util.htmlToBlobUrl(resp);
          util.renderUrl = function(){
            return url;
          };  
        }
      });
      util.renderUrl = function(){
        return util.RENDER_HTML_URL;
      };  
      return util.RENDER_HTML_URL;
    } else {
      var url = util.htmlToBlobUrl(html);
      util.renderUrl = function(){
        return url;
      };
      return url;
    }
  }

  postToUrl: function(path, params, method) {
    method = method || "post"; // Set method to post by default, if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
 }
};
