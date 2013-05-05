//     prefetcher.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Finds anchor links on current page and prefetch resources on those links

function Prefetcher () {
  // Contructor
  // ==========
  
  var self = this;
  
  // Pages that we've already fetched.
  this._alreadyFetched = {};

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

// Stop prefetching completely, probably because we changed pages or something.
Prefetcher.STOPPED = 2

// Resource is downloaded and available
Prefetcher.STATUS_COMPLETE = 3;

// _findLinks
// =======
// **_findLinks ( )**
//
// Query document for anchor tags and pass to _getLink
Prefetcher.prototype._findLinks = function(){
  var els = document.querySelectorAll('a');
  
  var fetchQueue = [];
  
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
  // TODO: Tie into web analytics/logging. Determine what links are most likely to be clicked on. 
  //       Put those on the top of the list.
  
  var links = Object.keys(this._links);
  
  // add all links to back of the fetchQueue
  for(var i = 0; i < links.length; i++){
    fetchQueue.push(links[i]);
  }
  
  // Loop through links and begin prefetching
  var self = this;
  var fetchLink = function() {
    if(fetchQueue.length > 0){
		  self._getLink(fetchQueue.shift(), fetchLink);
	  }
  };
  // Number of simulatenous fetches
  var numFetches = 2;
  
  for(var i = 0; i < numFetches; i++){
	  fetchLink();
  }
};

// _getLink
// =======
// **_getLink ( url, onDone)**
//
// onDone is a callback to do something once this is finished. Can be null.
// Currently used to fetch the next element becacuse we want to fetch one by one.
//
// Download given HTML link, store its DOM representation, and pass to _handleLink
// We'll be calling this from other than just findlinks above. (e.g., on mouseover)
Prefetcher.prototype._getLink = function(url, onDone){

  util.log('Prefetching link', url);
  // Check if we've already begun fetching this url. 
  if(this._alreadyFetched.hasOwnProperty(url)){
	  if(onDone != null){
		onDone();
	  }
      return;
  }

  this._alreadyFetched[url] = true;
  
  var self = this;
  this._net.xhrGet(url, function(err, file){
    if (err) {
	  if(onDone != null){
		onDone();
	  }
      return;
    }
    var parser = new PageParser(file.data);
    // Store the parsed DOM
    var dom = parser.dom;
    dom._url = url;
    self._pages[url] = dom;
    // Handle the parsed resources
    self._handleLink(parser.resources);
    // Write the new DOM into page cache
    self._writePage(url);
    // Replace the link on current page with page cache link
    self._replaceLink(url);
	// Call the onDone function
	if(onDone != null){
		onDone();
		}  
  });
};

// _handleLink
// =======
// **_handleLink ( url )**
//
// Start downloading resources for given url and parser
Prefetcher.prototype._handleLink = function(newResources){
  
  util.log('Got resources', newResources);
  
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
      // We haven't seen this resource yet
      this._handleNewResource(url, newResources[url]);
    }
  }
};

Prefetcher.prototype._handleNewResource = function(url, els) {
  var self = this;
  
  var resource = {
    elements: els,
    status: Prefetcher.STATUS_NEW
  };
  this._resources[url] = resource;
  
  // Mark this file as being donwloaded
  resource.status = Prefetcher.STATUS_DOWNLOADING;
  // Get the file via P2P
  
  this._cache.hasFile(url, function(err, has) {
    if (has) {
      util.log('Found previously cached resource', url);
      resource.status = Prefetcher.STATUS_COMPLETE;
      self._setPrefetchedElements(resource.elements);
    } else {
      util.log('Getting file by peer', url);
      self._net.peerGet(url, function(err, file) {
        if (err) {
          return;
        }
        self._cache.writeFile(url, file.expiry, file.data);
        resource.status = Prefetcher.STATUS_COMPLETE;
        self._setPrefetchedElements(resource.elements);
        
      }); 
    }
  });
}

// _setPrefetchedElements
// =======
// **_setPrefetchedElements ( els )**
//
// Marks elements are prefetched so render.html knows what to do and update page in page cache
Prefetcher.prototype._setPrefetchedElements = function(els){
  var pages = {};
  
  var self = this;
  
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    // Stow would disable the element
    Renderer[el.tagName].stowUrl(el);
    el.dataset.prefetched = true;
    pages[el.ownerDocument._url] = true;
    
    // GHETTO HACK
    
    if (el.tagName == 'LINK' && el.dataset.href.substr(-4) == '.css') {
      var doc = el.ownerDocument.documentElement;
      var href = el.dataset.href;
      el.parentNode.removeChild(el);
      (function(doc, href, _url){
        util.xhrFile(href, function(x, data){
          var css = data;
          var style = document.createElement('style');
          style.type = 'text/css';
          if (style.styleSheet){
            style.styleSheet.cssText = css;
          } else {
            style.appendChild(document.createTextNode(css));
          }
          doc.getElementsByTagName('head')[0].appendChild(style);
          self._writePage(_url);
        });
      })(doc, href, el.ownerDocument._url);
    }
  }
  // Update affected pages
  var pageUrls = Object.keys(pages);
  for (var i = 0; i < pageUrls.length; i++) {
    this._writePage(pageUrls[i]);
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
Prefetcher.prototype._writePage = function(url) {

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
  var fileUrl;
  
  if (util.isFirefox) {
    fileUrl = util.RENDER_HTML_URL + '#' + url;
  } else {
    fileUrl = util.renderUrl() + '#' + url; 
  }
  
  this._fillElements(fileUrl, this._links[url]);
};


exports.Prefetcher = Prefetcher;
