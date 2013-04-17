//     prefetcher.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Finds anchor links on current page and prefetch resources on those links

function Prefetcher () {
  // Contructor
  // ==========
  
  // Mapping of prefetched urls to relevant resource
  this._links = {};
}

// _findLinks
// =======
// **_findLinks ( )**
//
// Query document for anchor tags and begin prefetching them if valid
Prefetcher.prototype._findLinks = function(){
  var els = document.querySelectorAll('a');
  for (var i = 0; i < els.length; i++) {
    var url = els[i].href;
    // Call link validator to determine if we should prefetch the link
    if (Validator.validatePrefetchLink(url)) {
      this._links[url] = null;
    }
  }
  
  var links = Object.keys(this._links);
  // Loop through links and begin prefetching
  for (var i = 0; i < links.length; i++) {
    this._links[i] = this._getLink(links[i]);
  }
};

// _getLink
// =======
// **_getLink ( url )**
//
// Prefetch given url with XHR
Prefetcher.prototype._getLink = function(url){
  
};