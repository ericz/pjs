function BrowserCache () {
  
  var self = this;
  
  var request = indexedDB.open(this.DB_NAME, this.SCHEMA_VERSION);
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    // A versionchange transaction is started automatically.
    e.target.transaction.onerror = html5rocks.indexedDB.onerror;
    if (db.objectStoreNames.contains(this.FILESTORE_NAME)) {
      db.deleteObjectStore(this.FILESTORE_NAME);
    }
    var store = db.createObjectStore(this.FILESTORE_NAME, {keyPath: 'url'});
  };

  request.onsuccess = function(e) {
    this._db = e.target.result;
    // DB ready to use
  };
}

BrowserCache.prototype.DB_NAME = 'pjs';
BrowserCache.prototype.FILESTORE_NAME = 'files';
BrowserCache.prototype.SCHEMA_VERSION = 1;

BrowserCache.prototype.x = function() {
};