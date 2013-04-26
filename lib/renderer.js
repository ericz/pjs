//     renderer.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Contains functions to get and set URLs in various HTML element types
// We can't use shortcuts like '.src' because those don't work without a origin context for pages, which is the case for virtual DOMs that we sometime use

var Renderer = {
  'IMG': {
    getUrl: function(el) {
      return el.getAttribute('src');
    },
    getAbsoluteUrl: function(el) {
      return el.src;
    },
    setUrl: function(el, url) {
      el.setAttribute('src', url);
    },
    stowUrl: function(el) {
      el.dataset.src = el.getAttribute('src');
      el.removeAttribute('src');
    },
    getStowedUrl: function(el) {
      return el.dataset.src
    },
    isLoaded: function(el) {
      return el.complete;
    }
  },
  'A': {
    getUrl: function(el) {
      return el.getAttribute('href');
    },
    getUrl: function(el) {
      return el.href;
    },
    setUrl: function(el, url) {
      el.setAttribute('href', url);
    },
    stowUrl: function(el) {
      el.dataset.href = el.getAttribute('href');
      el.removeAttribute('href');
    },
    getStowedUrl: function(el) {
      return el.dataset.href
    },
    isLoaded: function(el) {
      return true;
    }
  }
};