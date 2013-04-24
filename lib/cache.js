//     cache.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// A cache for files similar to the browser cache with expiry support

function PrefetcherCache () {
  // Contructor
  // ==========
  
  var self = this;
  
  // Open up the IndexedDB
  var request = indexedDB.open(PrefetcherCache.DB_NAME, PrefetcherCache.SCHEMA_VERSION);
  
  // Ensure that we have the correct schema, if not create the correct schema
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    if (db.objectStoreNames.contains(PrefetcherCache.FILESTORE_NAME)) {
      db.deleteObjectStore(PrefetcherCache.FILESTORE_NAME);
    }
    // Tables will be keyed by file URL
    var store = db.createObjectStore(PrefetcherCache.FILESTORE_NAME, {keyPath: 'url'});
    if (db.objectStoreNames.contains(PrefetcherCache.PAGESTORE_NAME)) {
      db.deleteObjectStore(PrefetcherCache.PAGESTORE_NAME);
    }
    // Tables will be keyed by file URL
    var store = db.createObjectStore(PrefetcherCache.PAGESTORE_NAME, {keyPath: 'url'});
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
    util.log('Database opening error', e);
  };
}

// Hard coded database name
PrefetcherCache.DB_NAME = 'pjs';
// Hard coded table name
PrefetcherCache.FILESTORE_NAME = 'files';
// Hard coded table name
PrefetcherCache.PAGESTORE_NAME = 'html';
// Current schema version. This goes up when the schema changes
PrefetcherCache.SCHEMA_VERSION = 3;


// getFile
// =======
// **getFile ( url , callback (err, file) )**
PrefetcherCache.prototype.getFile = function(url, cb) {
  var self = this;
  // Begin database transaction
  var transaction = this._db.transaction([PrefetcherCache.FILESTORE_NAME]);
  var objectStore = transaction.objectStore(PrefetcherCache.FILESTORE_NAME);
  
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
PrefetcherCache.prototype.writeFile = function(url, expiry, data) {
  var transaction = this._db.transaction([PrefetcherCache.FILESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(PrefetcherCache.FILESTORE_NAME);
  var request = objectStore.put({url: url, expiry: expiry, data: data});
};

// removeFile
// =======
// **removeFile ( url )**
PrefetcherCache.prototype.removeFile = function(url) {
  var transaction = this._db.transaction([PrefetcherCache.FILESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(PrefetcherCache.FILESTORE_NAME)
  var request = objectStore.delete(url);
};


// getPage
// =======
// **getPage ( url , callback (err, file) )**
PrefetcherCache.prototype.getPage = function(url, cb) {
  var self = this;
  // Begin database transaction
  var transaction = this._db.transaction([PrefetcherCache.PAGESTORE_NAME]);
  var objectStore = transaction.objectStore(PrefetcherCache.PAGESTORE_NAME);
  
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
PrefetcherCache.prototype.writePage = function(url, data) {
  var transaction = this._db.transaction([PrefetcherCache.PAGESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(PrefetcherCache.PAGESTORE_NAME);
  var request = objectStore.put({url: url, data: data});
};

// removePage
// =======
// **removePage ( url )**
PrefetcherCache.prototype.removePage = function(url) {
  var transaction = this._db.transaction([PrefetcherCache.PAGESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(PrefetcherCache.PAGESTORE_NAME)
  var request = objectStore.delete(url);
};


