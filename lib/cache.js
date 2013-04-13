function BrowserCache () {
  
  var self = this;
  
  var request = indexedDB.open(this.DB_NAME, this.SCHEMA_VERSION);
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    if (db.objectStoreNames.contains(self.FILESTORE_NAME)) {
      db.deleteObjectStore(self.FILESTORE_NAME);
    }
    var store = db.createObjectStore(self.FILESTORE_NAME, {keyPath: 'url'});
  };

  request.onsuccess = function(e) {
    self._db = e.target.result;
    self._db.onerror = function(e) {
      // bubbled erro
      util.log('Database error', e);
    };
    // DB ready to use
  };
  
  request.onerror = function(e) {
    util.log('Database openning error', e);
  };
}

BrowserCache.prototype.DB_NAME = 'pjs';
BrowserCache.prototype.FILESTORE_NAME = 'files';
BrowserCache.prototype.SCHEMA_VERSION = 2;

BrowserCache.prototype.getFile = function(url, cb) {
  var self = this;
  var transaction = this._db.transaction([this.FILESTORE_NAME]);
  var objectStore = transaction.objectStore(this.FILESTORE_NAME);
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
    } else if (result.expiry > (new Date()).getTime()) {
      cb(null, result);
    } else {
      self.removeFile(url);
      cb(new Error('Expired'), null);
    }
  };
};

BrowserCache.prototype.writeFile = function(url, expiry, data) {
  var transaction = this._db.transaction([this.FILESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(this.FILESTORE_NAME);
  var request = objectStore.add({url: url, expiry: expiry, data: data});
};

BrowserCache.prototype.removeFile = function(url) {
  var transaction = this._db.transaction([this.FILESTORE_NAME], "readwrite");
  var objectStore = transaction.objectStore(this.FILESTORE_NAME)
  var request = objectStore.delete(url);
};

