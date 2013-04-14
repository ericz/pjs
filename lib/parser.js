function PageParser(html) {
  this._html = html;
  this.resources = {};
  
  this._parse();
  this._extract();
}



PageParser.prototype._parse = function() {
  this._dom = document.implementation.createHTMLDocument('');
  this._dom.documentElement.innerHTML = this._html;
}


PageParser.prototype._extract = function() {
  var els = document.querySelectorAll('img, script, link');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    switch(el.tagName) {
      case 'IMG':
        this._handleImg(el);
        break;
      /*case: 'SCRIPT'
        break;
      case: 'LINK'
        break;*/
    }
  }
};

PageParser.prototype._handleImg = function(el) {
  this._addURL(util.absoluteURL(el.src), el);
};

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
 