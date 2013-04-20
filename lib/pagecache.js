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
    if (db.objectStoreNames.contains(PageCache.FILESTORE_NAME)) {
      db.deleteObjectStore(PageCache.FILESTORE_NAME);
    }
    // Tables will be keyed by file URL
    var store = db.createObjectStore(PageCache.FILESTORE_NAME, {keyPath: 'url'});
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
PageCache.FILESTORE_NAME = 'html';
// Current schema version. This goes up when the schema changes
PageCache.SCHEMA_VERSION = 0;

/*
// getFile
// =======
// **getFile ( url , callback (err, file) )**
BrowserCache.prototype.getFile = function(url, cb) {
  var self = this;
  // Begin database transaction
  var transaction = this._db.transaction([BrowserCache.FILESTORE_NAME]);
  var objectStore = transaction.objectStore(BrowserCache.FILESTORE_NAME);
  
  // Get file keyed by provided url
  var request = objectStore.get(url);
  request.onerror = function(event) {
    // Handle errors!
    cb(new Error(event), null);
  };
  request.onsuccess = function(event) {
    // Do something with the request.result!
    var result = event.target.result;
   
    // **Possible results**
   
   // File is not found
    if (!result) {
      cb(new Error('No file'), null);
    // Successfully found valid file
    } else if (result.expiry > (new Date()).getTime()) {
      cb(null, result);
    // Result is expired, remove it from the cache
    } else {
      self.removeFile(url);
      cb(new Error('Expired'), null);
    }
  };
};

// writeFile
// =======
// **writeFile ( url , expiry , data )**
//
// expiry: integer milliseconds timestamp
// 
// data: file contents as an ArrayBuffer
BrowserCache.prototype.writeFile = function(url, expiry, data) {
  var transaction = this._db.transaction([BrowserCache.FILESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(BrowserCache.FILESTORE_NAME);
  var request = objectStore.add({url: url, expiry: expiry, data: data});
};

// removeFile
// =======
// **removeFile ( url )**
BrowserCache.prototype.removeFile = function(url) {
  var transaction = this._db.transaction([BrowserCache.FILESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(BrowserCache.FILESTORE_NAME)
  var request = objectStore.delete(url);
};*/
