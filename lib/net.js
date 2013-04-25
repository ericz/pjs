function Net () {
}

Net.prototype.xhrGet = function (url, cb, binary) {
  var http = new XMLHttpRequest();
  http.open('get', url, true);
  if (binary) {
    http.responseType = "blob"; 
  }
  http.onload = function(e) {
    if (http.status == 200) {
      var d = new Date(http.getResponseHeader('expires'));
      var file = {data: http.response, expiry: d.getTime()};
      cb(null, file);
    } else {
      cb(new Error(http.status), null);
    }
  }
  http.send(null);
};

Net.prototype.peerGet = function (url, cb) {
  // Temporarily just use XHR
  this.xhrGet(url, cb);
};
