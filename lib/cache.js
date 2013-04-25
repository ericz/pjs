//     cache.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// A cache for files similar to the browser cache with expiry support

function PrefetcherCache (cb) {
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
    db.createObjectStore(PrefetcherCache.FILESTORE_NAME, {keyPath: 'url'});
    if (db.objectStoreNames.contains(PrefetcherCache.PAGESTORE_NAME)) {
      db.deleteObjectStore(PrefetcherCache.PAGESTORE_NAME);
    }
    // Tables will be keyed by file URL
    db.createObjectStore(PrefetcherCache.PAGESTORE_NAME, {keyPath: 'url'});
  };

  // Upon successful opening of database, store reference to the database
  request.onsuccess = function(e) {
    self._db = e.target.result;
    self._db.onerror = function(e) {
      util.log('Database error', e);
    };
    cb(null, self._db);
    // DB ready to use
  };
  
  request.onerror = function(e) {
    util.log('Database opening error', e);
    cb(e, null);
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
  this._get(PrefetcherCache.FILESTORE_NAME, url, function(err, result){
    if (err || !result) {
      cb(new Error('No file'), null);
    } else if (result.expiry > (new Date()).getTime()) {
      // Successfully found valid file
      cb(null, result);
    } else {
      // Result is expired, remove it from the cache
      self.removeFile(url);
      cb(new Error('Expired'), null);
    }
  });
};

// hasFile
// =======
// **hasFile ( url , callback (err, bool) )**
PrefetcherCache.prototype.hasFile = function(url, cb) {
  this._has(PrefetcherCache.FILESTORE_NAME, url, cb);
};

// writeFile
// =======
// **writeFile ( url , expiry , data )**
//
// expiry: integer milliseconds timestamp
// 
// data: file contents as an ArrayBuffer
PrefetcherCache.prototype.writeFile = function(url, expiry, data) {
  this._write(PrefetcherCache.FILESTORE_NAME, {url: url, expiry: expiry, data: data});
};

// removeFile
// =======
// **removeFile ( url )**
PrefetcherCache.prototype.removeFile = function(url) {
  this._remove(PrefetcherCache.FILESTORE_NAME, url);
};

// hasPage
// =======
// **hasPage ( url , callback (err, bool) )**
PrefetcherCache.prototype.hasPage = function(url, cb) {
  this._has(PrefetcherCache.PAGESTORE_NAME, url, cb);
};

// getPage
// =======
// **getPage ( url , callback (err, file) )**
PrefetcherCache.prototype.getPage = function(url, cb) {
  this._get(PrefetcherCache.PAGESTORE_NAME, function(err, result){
    if (err || !result) {
      cb(new Error('No file'), null);
    } else {
      // Successfully found valid file
      cb(null, result);
    }
  });
};

// writePage
// =======
// **writePage ( url , data )**
// 
// data: file contents as an ArrayBuffer
PrefetcherCache.prototype.writePage = function(url, data) {
  this._write(PrefetcherCache.PAGESTORE_NAME, {url: url, data: data});
};

// removePage
// =======
// **removePage ( url )**
PrefetcherCache.prototype.removePage = function(url) {
  this._remove(PrefetcherCache.PAGESTORE_NAME, url);
};




PrefetcherCache.prototype._get = function(store, key, cb) {
  var self = this;
  // Begin database transaction
  var transaction = this._db.transaction([store]);
  var objectStore = transaction.objectStore(store);
  
  // Get file keyed by provided key
  var request = objectStore.get(key);
  request.onerror = function(event) {
    // Handle errors!
    cb(new Error(event), null);
  };
  request.onsuccess = function(event) {
    cb(null, event.target.result);
  };
};

PrefetcherCache.prototype._write = function(store, data) {
  var transaction = this._db.transaction([store], "readwrite");
  var objectStore = transaction.objectStore(store);
  var request = objectStore.put(data);
};

PrefetcherCache.prototype._remove = function(store, key) {
  var transaction = this._db.transaction([store], "readwrite");
  var objectStore = transaction.objectStore(store)
  var request = objectStore.delete(key);
};

PrefetcherCache.prototype._has = function(store, key, cb) {
  // Begin database transaction
  var transaction = this._db.transaction([store]);
  var objectStore = transaction.objectStore(store);
  
  // Get file keyed by provided url
  var request = objectStore.count(key);
  request.onerror = function(event) {
    // Handle errors!
    cb(new Error(event), null);
  };
  request.onsuccess = function(event) {
    var result = event.target.result;
    cb(null, result > 0);
  };
};





