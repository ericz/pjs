function Prefetcher () {
  this._links = {};
}

Prefetcher.prototype._findLinks = function(){
  var els = document.querySelectorAll('a');
  for (var i = 0; i < els.length; i++) {
    var url = els[i].href;
    if (Validator.validatePrefetchLink(url)) {
      this._links[url] = null;
    }
  }
  
  var links = Object.keys(this._links);
  for (var i = 0; i < links.length; i++) {
    this._links[i] = this._getLink(links[i]);
  }
};

Prefetcher.prototype._getLink = function(url){
  
};