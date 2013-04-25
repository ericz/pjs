var http = require('http');
var path = require('path');
var ErrorPage = require('error-page');
var ecstatic = require('ecstatic');

var PUBLIC = path.join(__dirname, 'static');
var PORT = 9999;

var static = ecstatic({
  root: PUBLIC, autoIndex: true, cache: 1//, defaultExt: 'html'
});

http.createServer(function(req, res) {
  res.error = ErrorPage(req, res);
  return static(req, res);
}).listen(PORT);

console.log('serving pjs on http://localhost:' + PORT
  + ' with ecstatic@' + ecstatic.version + ' & node@' + process.version
);
