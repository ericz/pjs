var fs = require('fs');
var exec = require('child_process').exec;

process.chdir(__dirname + '/..');

var files = fs.readdirSync('lib').map(function(name){ return 'lib/' + name }).join(' ');

child = exec('docco ' + files, function(_err, stdout, _stderr){
  console.log(stdout);
});