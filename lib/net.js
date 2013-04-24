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
      cb(null, http.response);
    } else {
      cb(new Error(http.status), null);
    }
  }
  http.send(null);
};
