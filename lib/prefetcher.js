//     prefetcher.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Finds anchor links on current page and prefetch resources on those links

function Prefetcher () {
  // Contructor
  // ==========
  
  var self = this;
  
  // Mapping of prefetched urls to PageParser generated DOM
  this._pages = {};
  
  // Mapping of all anchor tag destinations on this page to array of anchor tag DOM elements
  this._links = {};
  
  // Mapping of resource URLs to resource objects:  
  //
  //   resource: `{ elements: [], status: status }`
  //
  //   status: One of `Prefetcher.STATUS_NEW` `Prefetcher.STATUS_DOWNLOADING` `Prefetcher.STATUS_COMPLETE`
  this._resources = {};
  
  // Interface for downloading files peer-to-peer and with XHR
  this._net = new Net();
  
  // Browser cache
  this._cache = new PrefetcherCache(function(err, db){
    // DB is open
    if (err) {
      return;
    }
    self._findLinks();
  });
  
}

// Resource has not begun to be downloaded
Prefetcher.STATUS_NEW = 0;

// Resource is currently being downloaded
Prefetcher.STATUS_DOWNLOADING = 1;

// Resource is downloaded and available
Prefetcher.STATUS_COMPLETE = 2;

// _findLinks
// =======
// **_findLinks ( )**
//
// Query document for anchor tags and pass to _getLink
Prefetcher.prototype._findLinks = function(){
  var els = document.querySelectorAll('a');
  
  
  for (var i = 0; i < els.length; i++) {
    var url = els[i].href;
    // Call link validator to determine if we should prefetch the link
    if (Validator.validatePrefetchLink(els[i])) {
      if (!this._links[url]) {
        this._links[url] = [];
      }
      this._links[url].push(els[i]);
    }
  }
  
  
  // This is a good place to determine strategy for prefetching links
  
  var links = Object.keys(this._links);
  // Loop through links and begin prefetching
  for (var i = 0; i < links.length; i++) {
    // Let _getLink handle it from here
    this._getLink(links[i]);
  }
};

// _getLink
// =======
// **_getLink ( url )**
//
// Download given HTML link, store its DOM representation, and pass to _handleLink
Prefetcher.prototype._getLink = function(url){

  util.log('Prefetching link', url);

  var self = this;
  this._net.xhrGet(url, function(err, file){
    if (err) {
      return;
    }
    var parser = new PageParser(file.data);
    // Store the parsed DOM
    self._pages[url] = parser.dom;
    // Handle the parsed resources
    self._handleLink(parser.resources);
    // Write the new DOM into page cache
    self._writePage(url);
    // Replace the link on current page with page cache link
    self._replaceLink(url);
  });
};

// _handleLink
// =======
// **_handleLink ( url )**
//
// Start downloading resources for given url and parser
Prefetcher.prototype._handleLink = function(newResources){
  
  util.log('Got resources', newResources);
  
  var self = this;
  
  var urls = Object.keys(newResources);
  // This is a good place to determine which resources on prefetched links to download
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (this._resources[url]) {
      var resource = this._resources[url];
      resource.elements = resource.elements.concat(newResources[url]);
      if (resource.status === Prefetcher.STATUS_COMPLETE) {
        this._setPrefetchedElements(newResources[url]);
      }
    } else {
      var resource = {
        elements: newResources[url],
        status: Prefetcher.STATUS_NEW
      };
      this._resources[url] = resource;
      
      // Mark this file as being donwloaded
      resource.status = Prefetcher.STATUS_DOWNLOADING;
      // Get the file via P2P
      this._net.peerGet(url, function(err, file){
        resource.status = Prefetcher.STATUS_COMPLETE;
        self._cache.writeFile(url, file.expiry, file.data);
        self._setPrefetchedElements(resource.elements);
      });
      
    }
  }
};

// _setPrefetchedElements
// =======
// **_setPrefetchedElements ( els )**
//
// Marks elements are prefetched so render.html knows what to do
Prefetcher.prototype._setPrefetchedElements = function(els){
  for (var i = 0; i < els; i++) {
    // Stow would disable the element
    // Renderer[el.tagName].stowUrl(el);
    el.dataset.prefetched = true;
  }
};

// _fillElements
// =======
// **_fillElements ( url , els)**
//
// Assign the given URL to the given elements
Prefetcher.prototype._fillElements = function(url, els){
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    Renderer[el.tagName].setUrl(el, url);
  }
};

// _writePage
// =======
// **_writePage ( url )**
//
// Write the DOM for the given URL into page cache
Prefetcher.prototype._writePage = function(url){

  util.log('Writing page', url);

  var dom = this._pages[url];
  var html = dom.documentElement.innerHTML; /* TODO  Does using innerHTML (excludes the <html> tag) fuck anything up? */
  
  try {
    // Write in localStorage for bonus performance
    localStorage.setItem(url, html);
  } catch (e) {
    // Local storage full, write into indexedDB
    this._cache.writePage(url, html);
  }
};

// _replaceLink
// =======
// **_replaceLink ( url )**
//
// Replace the link on current page with the render.html link
Prefetcher.prototype._replaceLink = function(url){
  
  util.log('Replacings links to', url);
  
  var fileUrl = util.renderUrl() + '#' + url; /* TODO  Support Firefox by not using Blob URL*/
  this._fillElements(fileUrl, this._links[url]);
};


exports.Prefetcher = Prefetcher;
