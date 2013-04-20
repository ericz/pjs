//     renderer.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Contains functions to get and set URLs in various HTML element types

var Renderer = {
  'IMG': {
    function getUrl(el) {
      return el.src;
    },
    function setUrl(el, url) {
      el.src = url;
    }
  },
  'A': {
    function getUrl(el) {
      return el.href;
    },
    function setUrl(el, url) {
      el.href = url;
    }
  }
};