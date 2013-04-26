//     validator.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Various helper function related to identifying which links to follow and resources to prefetch

var Validator = {

  // **validatePrefetchLink ( url )**
  // 
  // Determine if the given URL should be prefetched
  validatePrefetchLink: function(link){
           // Make sure we have same origin
    return link.origin === location.origin &&
           // Make sure we're not prefetching the current page
           link.href !== location.toString();
  },
  validateResource: function(url){
    url = util.resolveURL(url);
           // Make sure we have same origin
    return url.origin === location.origin &&
           // Make sure we're not prefetching the current page (should never happen-
           url.href !== location.toString();
  }
};