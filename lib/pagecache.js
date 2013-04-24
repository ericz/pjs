//     pagecache.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Cache for prefetched HTML files that contain other prefetched resources

function PageCache () {
  // Contructor
  // ==========
  
  var self = this;
  
  // Open up the IndexedDB
  var request = indexedDB.open(PageCache.DB_NAME, PageCache.SCHEMA_VERSION);
  
  // Ensure that we have the correct schema, if not create the correct schema
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    if (db.objectStoreNames.contains(PageCache.PAGESTORE_NAME)) {
      db.deleteObjectStore(PageCache.PAGESTORE_NAME);
    }
    // Tables will be keyed by file URL
    var store = db.createObjectStore(PageCache.PAGESTORE_NAME, {keyPath: 'url'});
  };

  // Upon successful opening of database, store reference to the database
  request.onsuccess = function(e) {
    self._db = e.target.result;
    self._db.onerror = function(e) {
      util.log('Database error', e);
    };
    // DB ready to use
  };
  
  request.onerror = function(e) {
    util.log('Database openning error', e);
  };
}

// Hard coded database name
PageCache.DB_NAME = 'pjs';
// Hard coded table name
PageCache.PAGESTORE_NAME = 'html';
// Current schema version. This goes up when the schema changes
PageCache.SCHEMA_VERSION = 2;


// getPage
// =======
// **getPage ( url , callback (err, file) )**
PageCache.prototype.getPage = function(url, cb) {
  var self = this;
  // Begin database transaction
  var transaction = this._db.transaction([PageCache.PAGESTORE_NAME]);
  var objectStore = transaction.objectStore(PageCache.PAGESTORE_NAME);
  
  // Get file keyed by provided url
  var request = objectStore.get(url);
  request.onerror = function(event) {
    // Handle errors!
    cb(new Error(event), null);
  };
  request.onsuccess = function(event) {
    // Do something with the request.result!
    var result = event.target.result;
    if (!result) {
      cb(new Error('No file'), null);
    // Successfully found valid file
    } else {
      cb(null, result);
    }
  };
};

// writePage
// =======
// **writePage ( url , data )**
// 
// data: file contents as an ArrayBuffer
PageCache.prototype.writePage = function(url, data) {
  var transaction = this._db.transaction([PageCache.PAGESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(PageCache.PAGESTORE_NAME);
  var request = objectStore.put({url: url, data: data});
};

// removePage
// =======
// **removePage ( url )**
PageCache.prototype.removePage = function(url) {
  var transaction = this._db.transaction([PageCache.PAGESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(PageCache.PAGESTORE_NAME)
  var request = objectStore.delete(url);
};

