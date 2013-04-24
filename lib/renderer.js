//     renderer.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Contains functions to get and set URLs in various HTML element types

var Renderer = {
  'IMG': {
    getUrl: function(el) {
      return el.src;
    },
    setUrl: function(el, url) {
      el.src = url;
    },
    stowUrl: function(el) {
      el.dataset.src = el.src;
      el.removeAttribute('src');
    }
  },
  'A': {
    getUrl: function(el) {
      return el.href;
    },
    setUrl: function(el, url) {
      el.href = url;
    },
    stowUrl: function(el) {
      el.dataset.href = el.href;
      el.removeAttribute('href');
    }
  }
};