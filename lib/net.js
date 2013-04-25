function Net () {
}

Net.prototype.xhrGet = function (url, cb, binary) {
  var http = new XMLHttpRequest();
  http.open('get', url, true);
  if (binary) {
    http.responseType = binary; 
  }
  http.onload = function(e) {
    if (http.status == 200) {
      // Get cache expiration time
      var cur = Date.now();
      var re = /max\-age=([0-9]+)/gi.exec(http.getResponseHeader('Cache-control'));
      var maxage = 0;
      if (re && re[1]) {
        maxage = re[1] * 1000 + cur;
      }
      var expires = (new Date(http.getResponseHeader('Expires'))).getTime();
      var file = {data: http.response, expiry: Math.max(expires, maxage)};
      cb(null, file);
    } else {
      cb(new Error(http.status), null);
    }
  }
  http.send(null);
};

Net.prototype.peerGet = function (url, cb) {
  // Temporarily just use XHR
  this.xhrGet(url, cb, 'arraybuffer');
};
