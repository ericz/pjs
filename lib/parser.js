//     parser.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Parser for arbitrary HTML string to find its peer-downloadable assets

function PageParser(html) {
  // Contructor
  // ==========
  this._html = html;
  
  // Mapping of URLs to list of DOM elements that require it
  this.resources = {};
  
  // Parsing HTML into DOM tree
  this._parse();
  
  // Extract parseable resources
  this._extract();
}


// _parse
// =======
// **_parse ( )**
//
// Parse HTML by creating virtual DOM element
PageParser.prototype._parse = function() {
  this.dom = document.implementation.createHTMLDocument('');
  this.dom.documentElement.innerHTML = this._html;
}

// _extract
// =======
// **_extract ( )**
//
// Query for selected HTML elements and call corresponding handler functions
PageParser.prototype._extract = function() {
  var els = this.dom.querySelectorAll('img, script, link');
  // Loop through elements and switch on tag name
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    // Get the URL and add it to resources
    var url = Renderer[el.tagName].getUrl();
    this._addURL(util.absoluteURL(url), el);
  }
};

// _addURL
// =======
// **_addURL ( url , el )**
//
// Adds a given URL and DOM element to downloadable resources
PageParser.prototype._addURL = function(url, el){
  if (!this.resources[url]) {
    this.resources[url] = [];
  }
  this.resources[url].push(el);
};

/*
PageParser.prototype._handleScript = function() {
  var els = document.querySelectorAll('img');
}

PageParser.prototype._handleLink = function() {
  var els = document.querySelectorAll('img');
}*/
 