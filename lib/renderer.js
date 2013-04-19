//     renderer.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Contains functions to get and set URLs in various HTML element types

Renderer = {
  'IMG': {
    function getUrl(el) {
      return el.src;
    },
    function setUrl(el, url) {
      el.src = url;
    }
  }
}