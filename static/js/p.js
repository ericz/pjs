/*! p.js build:0.0.0, development. Copyright(c) 2013 Eric Zhang <eric@ericzhang.com> */
(function(exports){
var binaryFeatures = {};
binaryFeatures.useBlobBuilder = (function(){
  try {
    new Blob([]);
    return false;
  } catch (e) {
    return true;
  }
})();

binaryFeatures.useArrayBufferView = !binaryFeatures.useBlobBuilder && (function(){
  try {
    return (new Blob([new Uint8Array([])])).size === 0;
  } catch (e) {
    return true;
  }
})();

exports.binaryFeatures = binaryFeatures;
exports.BlobBuilder = window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder || window.BlobBuilder;

function BufferBuilder(){
  this._pieces = [];
  this._parts = [];
}

BufferBuilder.prototype.append = function(data) {
  if(typeof data === 'number') {
    this._pieces.push(data);
  } else {
    this._flush();
    this._parts.push(data);
  }
};

BufferBuilder.prototype._flush = function() {
  if (this._pieces.length > 0) {    
    var buf = new Uint8Array(this._pieces);
    if(!binaryFeatures.useArrayBufferView) {
      buf = buf.buffer;
    }
    this._parts.push(buf);
    this._pieces = [];
  }
};

BufferBuilder.prototype.getBuffer = function() {
  this._flush();
  if(binaryFeatures.useBlobBuilder) {
    var builder = new BlobBuilder();
    for(var i = 0, ii = this._parts.length; i < ii; i++) {
      builder.append(this._parts[i]);
    }
    return builder.getBlob();
  } else {
    return new Blob(this._parts);
  }
};
exports.BinaryPack = {
  unpack: function(data){
    var unpacker = new Unpacker(data);
    return unpacker.unpack();
  },
  pack: function(data, utf8){
    var packer = new Packer(utf8);
    var buffer = packer.pack(data);
    return buffer;
  }
};

function Unpacker (data){
  // Data is ArrayBuffer
  this.index = 0;
  this.dataBuffer = data;
  this.dataView = new Uint8Array(this.dataBuffer);
  this.length = this.dataBuffer.byteLength;
}


Unpacker.prototype.unpack = function(){
  var type = this.unpack_uint8();
  if (type < 0x80){
    var positive_fixnum = type;
    return positive_fixnum;
  } else if ((type ^ 0xe0) < 0x20){
    var negative_fixnum = (type ^ 0xe0) - 0x20;
    return negative_fixnum;
  }
  var size;
  if ((size = type ^ 0xa0) <= 0x0f){
    return this.unpack_raw(size);
  } else if ((size = type ^ 0xb0) <= 0x0f){
    return this.unpack_string(size);
  } else if ((size = type ^ 0x90) <= 0x0f){
    return this.unpack_array(size);
  } else if ((size = type ^ 0x80) <= 0x0f){
    return this.unpack_map(size);
  }
  switch(type){
    case 0xc0:
      return null;
    case 0xc1:
      return undefined;
    case 0xc2:
      return false;
    case 0xc3:
      return true;
    case 0xca:
      return this.unpack_float();
    case 0xcb:
      return this.unpack_double();
    case 0xcc:
      return this.unpack_uint8();
    case 0xcd:
      return this.unpack_uint16();
    case 0xce:
      return this.unpack_uint32();
    case 0xcf:
      return this.unpack_uint64();
    case 0xd0:
      return this.unpack_int8();
    case 0xd1:
      return this.unpack_int16();
    case 0xd2:
      return this.unpack_int32();
    case 0xd3:
      return this.unpack_int64();
    case 0xd4:
      return undefined;
    case 0xd5:
      return undefined;
    case 0xd6:
      return undefined;
    case 0xd7:
      return undefined;
    case 0xd8:
      size = this.unpack_uint16();
      return this.unpack_string(size);
    case 0xd9:
      size = this.unpack_uint32();
      return this.unpack_string(size);
    case 0xda:
      size = this.unpack_uint16();
      return this.unpack_raw(size);
    case 0xdb:
      size = this.unpack_uint32();
      return this.unpack_raw(size);
    case 0xdc:
      size = this.unpack_uint16();
      return this.unpack_array(size);
    case 0xdd:
      size = this.unpack_uint32();
      return this.unpack_array(size);
    case 0xde:
      size = this.unpack_uint16();
      return this.unpack_map(size);
    case 0xdf:
      size = this.unpack_uint32();
      return this.unpack_map(size);
  }
}

Unpacker.prototype.unpack_uint8 = function(){
  var byte = this.dataView[this.index] & 0xff;
  this.index++;
  return byte;
};

Unpacker.prototype.unpack_uint16 = function(){
  var bytes = this.read(2);
  var uint16 =
    ((bytes[0] & 0xff) * 256) + (bytes[1] & 0xff);
  this.index += 2;
  return uint16;
}

Unpacker.prototype.unpack_uint32 = function(){
  var bytes = this.read(4);
  var uint32 =
     ((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3];
  this.index += 4;
  return uint32;
}

Unpacker.prototype.unpack_uint64 = function(){
  var bytes = this.read(8);
  var uint64 =
   ((((((bytes[0]  * 256 +
       bytes[1]) * 256 +
       bytes[2]) * 256 +
       bytes[3]) * 256 +
       bytes[4]) * 256 +
       bytes[5]) * 256 +
       bytes[6]) * 256 +
       bytes[7];
  this.index += 8;
  return uint64;
}


Unpacker.prototype.unpack_int8 = function(){
  var uint8 = this.unpack_uint8();
  return (uint8 < 0x80 ) ? uint8 : uint8 - (1 << 8);
};

Unpacker.prototype.unpack_int16 = function(){
  var uint16 = this.unpack_uint16();
  return (uint16 < 0x8000 ) ? uint16 : uint16 - (1 << 16);
}

Unpacker.prototype.unpack_int32 = function(){
  var uint32 = this.unpack_uint32();
  return (uint32 < Math.pow(2, 31) ) ? uint32 :
    uint32 - Math.pow(2, 32);
}

Unpacker.prototype.unpack_int64 = function(){
  var uint64 = this.unpack_uint64();
  return (uint64 < Math.pow(2, 63) ) ? uint64 :
    uint64 - Math.pow(2, 64);
}

Unpacker.prototype.unpack_raw = function(size){
  if ( this.length < this.index + size){
    throw new Error('BinaryPackFailure: index is out of range'
      + ' ' + this.index + ' ' + size + ' ' + this.length);
  }
  var buf = this.dataBuffer.slice(this.index, this.index + size);
  this.index += size;
  
    //buf = util.bufferToString(buf);
  
  return buf;
}

Unpacker.prototype.unpack_string = function(size){
  var bytes = this.read(size);
  var i = 0, str = '', c, code;
  while(i < size){
    c = bytes[i];
    if ( c < 128){
      str += String.fromCharCode(c);
      i++;
    } else if ((c ^ 0xc0) < 32){
      code = ((c ^ 0xc0) << 6) | (bytes[i+1] & 63);
      str += String.fromCharCode(code);
      i += 2;
    } else {
      code = ((c & 15) << 12) | ((bytes[i+1] & 63) << 6) |
        (bytes[i+2] & 63);
      str += String.fromCharCode(code);
      i += 3;
    }
  }
  this.index += size;
  return str;
}

Unpacker.prototype.unpack_array = function(size){
  var objects = new Array(size);
  for(var i = 0; i < size ; i++){
    objects[i] = this.unpack();
  }
  return objects;
}

Unpacker.prototype.unpack_map = function(size){
  var map = {};
  for(var i = 0; i < size ; i++){
    var key  = this.unpack();
    var value = this.unpack();
    map[key] = value;
  }
  return map;
}

Unpacker.prototype.unpack_float = function(){
  var uint32 = this.unpack_uint32();
  var sign = uint32 >> 31;
  var exp  = ((uint32 >> 23) & 0xff) - 127;
  var fraction = ( uint32 & 0x7fffff ) | 0x800000;
  return (sign == 0 ? 1 : -1) *
    fraction * Math.pow(2, exp - 23);
}

Unpacker.prototype.unpack_double = function(){
  var h32 = this.unpack_uint32();
  var l32 = this.unpack_uint32();
  var sign = h32 >> 31;
  var exp  = ((h32 >> 20) & 0x7ff) - 1023;
  var hfrac = ( h32 & 0xfffff ) | 0x100000;
  var frac = hfrac * Math.pow(2, exp - 20) +
    l32   * Math.pow(2, exp - 52);
  return (sign == 0 ? 1 : -1) * frac;
}

Unpacker.prototype.read = function(length){
  var j = this.index;
  if (j + length <= this.length) {
    return this.dataView.subarray(j, j + length);
  } else {
    throw new Error('BinaryPackFailure: read index out of range');
  }
}
  
function Packer(utf8){
  this.utf8 = utf8;
  this.bufferBuilder = new BufferBuilder();
}

Packer.prototype.pack = function(value){
  var type = typeof(value);
  if (type == 'string'){
    this.pack_string(value);
  } else if (type == 'number'){
    if (Math.floor(value) === value){
      this.pack_integer(value);
    } else{
      this.pack_double(value);
    }
  } else if (type == 'boolean'){
    if (value === true){
      this.bufferBuilder.append(0xc3);
    } else if (value === false){
      this.bufferBuilder.append(0xc2);
    }
  } else if (type == 'undefined'){
    this.bufferBuilder.append(0xc0);
  } else if (type == 'object'){
    if (value === null){
      this.bufferBuilder.append(0xc0);
    } else {
      var constructor = value.constructor;
      if (constructor == Array){
        this.pack_array(value);
      } else if (constructor == Blob || constructor == File) {
        this.pack_bin(value);
      } else if (constructor == ArrayBuffer) {
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(new Uint8Array(value));
        } else {
          this.pack_bin(value);
        }
      } else if ('BYTES_PER_ELEMENT' in value){
        if(binaryFeatures.useArrayBufferView) {
          this.pack_bin(value);
        } else {
          this.pack_bin(value.buffer);
        }
      } else if (constructor == Object){
        this.pack_object(value);
      } else if (constructor == Date){
        this.pack_string(value.toString());
      } else if (typeof value.toBinaryPack == 'function'){
        this.bufferBuilder.append(value.toBinaryPack());
      } else {
        throw new Error('Type "' + constructor.toString() + '" not yet supported');
      }
    }
  } else {
    throw new Error('Type "' + type + '" not yet supported');
  }
  return this.bufferBuilder.getBuffer();
}


Packer.prototype.pack_bin = function(blob){
  var length = blob.length || blob.byteLength || blob.size;
  if (length <= 0x0f){
    this.pack_uint8(0xa0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xda) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdb);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
    return;
  }
  this.bufferBuilder.append(blob);
}

Packer.prototype.pack_string = function(str){
  var length;
  if (this.utf8) {
    var blob = new Blob([str]);
    length = blob.size;
  } else {
    length = str.length;
  }
  if (length <= 0x0f){
    this.pack_uint8(0xb0 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xd8) ;
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xd9);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
    return;
  }
  this.bufferBuilder.append(str);
}

Packer.prototype.pack_array = function(ary){
  var length = ary.length;
  if (length <= 0x0f){
    this.pack_uint8(0x90 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xdc)
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdd);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var i = 0; i < length ; i++){
    this.pack(ary[i]);
  }
}

Packer.prototype.pack_integer = function(num){
  if ( -0x20 <= num && num <= 0x7f){
    this.bufferBuilder.append(num & 0xff);
  } else if (0x00 <= num && num <= 0xff){
    this.bufferBuilder.append(0xcc);
    this.pack_uint8(num);
  } else if (-0x80 <= num && num <= 0x7f){
    this.bufferBuilder.append(0xd0);
    this.pack_int8(num);
  } else if ( 0x0000 <= num && num <= 0xffff){
    this.bufferBuilder.append(0xcd);
    this.pack_uint16(num);
  } else if (-0x8000 <= num && num <= 0x7fff){
    this.bufferBuilder.append(0xd1);
    this.pack_int16(num);
  } else if ( 0x00000000 <= num && num <= 0xffffffff){
    this.bufferBuilder.append(0xce);
    this.pack_uint32(num);
  } else if (-0x80000000 <= num && num <= 0x7fffffff){
    this.bufferBuilder.append(0xd2);
    this.pack_int32(num);
  } else if (-0x8000000000000000 <= num && num <= 0x7FFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xd3);
    this.pack_int64(num);
  } else if (0x0000000000000000 <= num && num <= 0xFFFFFFFFFFFFFFFF){
    this.bufferBuilder.append(0xcf);
    this.pack_uint64(num);
  } else{
    throw new Error('Invalid integer');
  }
}

Packer.prototype.pack_double = function(num){
  var sign = 0;
  if (num < 0){
    sign = 1;
    num = -num;
  }
  var exp  = Math.floor(Math.log(num) / Math.LN2);
  var frac0 = num / Math.pow(2, exp) - 1;
  var frac1 = Math.floor(frac0 * Math.pow(2, 52));
  var b32   = Math.pow(2, 32);
  var h32 = (sign << 31) | ((exp+1023) << 20) |
      (frac1 / b32) & 0x0fffff;
  var l32 = frac1 % b32;
  this.bufferBuilder.append(0xcb);
  this.pack_int32(h32);
  this.pack_int32(l32);
}

Packer.prototype.pack_object = function(obj){
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length <= 0x0f){
    this.pack_uint8(0x80 + length);
  } else if (length <= 0xffff){
    this.bufferBuilder.append(0xde);
    this.pack_uint16(length);
  } else if (length <= 0xffffffff){
    this.bufferBuilder.append(0xdf);
    this.pack_uint32(length);
  } else{
    throw new Error('Invalid length');
  }
  for(var prop in obj){
    if (obj.hasOwnProperty(prop)){
      this.pack(prop);
      this.pack(obj[prop]);
    }
  }
}

Packer.prototype.pack_uint8 = function(num){
  this.bufferBuilder.append(num);
}

Packer.prototype.pack_uint16 = function(num){
  this.bufferBuilder.append(num >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_uint32 = function(num){
  var n = num & 0xffffffff;
  this.bufferBuilder.append((n & 0xff000000) >>> 24);
  this.bufferBuilder.append((n & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((n & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((n & 0x000000ff));
}

Packer.prototype.pack_uint64 = function(num){
  var high = num / Math.pow(2, 32);
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}

Packer.prototype.pack_int8 = function(num){
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int16 = function(num){
  this.bufferBuilder.append((num & 0xff00) >> 8);
  this.bufferBuilder.append(num & 0xff);
}

Packer.prototype.pack_int32 = function(num){
  this.bufferBuilder.append((num >>> 24) & 0xff);
  this.bufferBuilder.append((num & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((num & 0x0000ff00) >>> 8);
  this.bufferBuilder.append((num & 0x000000ff));
}

Packer.prototype.pack_int64 = function(num){
  var high = Math.floor(num / Math.pow(2, 32));
  var low  = num % Math.pow(2, 32);
  this.bufferBuilder.append((high & 0xff000000) >>> 24);
  this.bufferBuilder.append((high & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((high & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((high & 0x000000ff));
  this.bufferBuilder.append((low  & 0xff000000) >>> 24);
  this.bufferBuilder.append((low  & 0x00ff0000) >>> 16);
  this.bufferBuilder.append((low  & 0x0000ff00) >>>  8);
  this.bufferBuilder.append((low  & 0x000000ff));
}
/**
 * Light EventEmitter. Ported from Node.js/events.js
 * Eric Zhang
 */

/**
 * EventEmitter class
 * Creates an object with event registering and firing methods
 */
function EventEmitter() {
  // Initialise required storage variables
  this._events = {};
}

var isArray = Array.isArray;


EventEmitter.prototype.addListener = function(type, listener, scope, once) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }
  
  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, typeof listener.listener === 'function' ?
            listener.listener : listener);
            
  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // If we've already got an array, just append.
    this._events[type].push(listener);

  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }
  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener, scope) {
  if ('function' !== typeof listener) {
    throw new Error('.once only takes instances of Function');
  }

  var self = this;
  function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  };

  g.listener = listener;
  self.on(type, g);

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener, scope) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var position = -1;
    for (var i = 0, length = list.length; i < length; i++) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener))
      {
        position = i;
        break;
      }
    }

    if (position < 0) return this;
    list.splice(position, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (list === listener ||
             (list.listener && list.listener === listener))
  {
    delete this._events[type];
  }

  return this;
};


EventEmitter.prototype.off = EventEmitter.prototype.removeListener;


EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.prototype.emit = function(type) {
  var type = arguments[0];
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var l = arguments.length;
        var args = new Array(l - 1);
        for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;
  } else {
    return false;
  }
};



//     util.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Various utility functions

var util = {
  
  // Whether we support Chrome yet
  chromeCompatible: true,
  
  // Whether we support Firefox yet
  firefoxCompatible: false,
  
  // Chrome version required for support
  chromeVersion: 26,
  
  // Firefox version required for support
  firefoxVersion: 22,

  // Whether we are in debug mode
  debug: true,
  
  // URL to render.html
  RENDER_HTML_URL: 'render.html',
  
  // Sumologic counter URL
  COUNTER_URL: 'https://collectors.sumologic.com/receiver/v1/http/ZaVnC4dhaV35KSlERGtg26eWXoZ0NjpvrPPIYs3FqYwz4CSR-mWnYrnc8kciNLii4sLppgZQrA5l-az6Y0rRT2FGVhWipeqRlQ02XmYyodZnNIW5afa_kw==',
  
  // OOP inheritance function as provided by the Node.js util library
  inherits: function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  },
  
  // Shallow extend functions as provided by the Node.js util library
  extend: function(dest, source) {
    for(var key in source) {
      if(source.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },
  
  // Binary packing function
  pack: BinaryPack.pack,
  
  // Binary unpacking functionlk
  unpack: BinaryPack.unpack,

  // Logging function, logs only if debug flag is true
  log: function () {
    if (util.debug) {
      var err = false;
      var copy = Array.prototype.slice.call(arguments);
      copy.unshift('PJS: ');
      for (var i = 0, l = copy.length; i < l; i++){
        if (copy[i] instanceof Error) {
          copy[i] = '(' + copy[i].name + ') ' + copy[i].message;
          err = true;
        }
      }
      err ? console.error.apply(console, copy) : console.log.apply(console, copy);
    }
  },

  // Runs a callback at end of event queue, optimized for performance using postMessage
  setZeroTimeout: (function(global) {
    var timeouts = [];
    var messageName = 'zero-timeout-message';

    function setZeroTimeoutPostMessage(fn) {
      timeouts.push(fn);
      global.postMessage(messageName, '*');
    }		

    function handleMessage(event) {
      if (event.source == global && event.data == messageName) {
        if (event.stopPropagation) {
          event.stopPropagation();
        }
        if (timeouts.length) {
          timeouts.shift()();
        }
      }
    }
    if (global.addEventListener) {
      global.addEventListener('message', handleMessage, true);
    } else if (global.attachEvent) {
      global.attachEvent('onmessage', handleMessage);
    }
    return setZeroTimeoutPostMessage;
  }(this)),
  
  // Converts a Blob to ArrayBuffer
  blobToArrayBuffer: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsArrayBuffer(blob);
  },
  
  // Converts a Blob to a string encoding
  blobToBinaryString: function(blob, cb){
    var fr = new FileReader();
    fr.onload = function(evt) {
      cb(evt.target.result);
    };
    fr.readAsBinaryString(blob);
  },
  
  // Converts a string to its ArrayBuffer representation
  binaryStringToArrayBuffer: function(binary) {
    var byteArray = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      byteArray[i] = binary.charCodeAt(i) & 0xff;
    }
    return byteArray.buffer;
  },
  
  // Generate a random token
  randomToken: function () {
    return Math.random().toString(36).substr(2);
  },
  
  // Retrieve a normalized absolute URL
  absoluteURL: function(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser.href;
  },
  
  resolveURL: function(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
  },
  
  // Check if browser version matches the required versions
  isBrowserCompatible: function() {
    var c, f;
    if (this.chromeCompatible) {
      if ((c = navigator.userAgent.split('Chrome/')) && c.length > 1) {
        var v = c[1].split('.')[0];
        return parseInt(v) >= this.chromeVersion;
      }
    }
    if (this.firefoxCompatible) {
      if ((f = navigator.userAgent.split('Firefox/')) && f.length > 1) {
        var v = f[1].split('.')[0];
        return parseInt(v) >= this.firefoxVersion;
      }
    }
    return false;
  },
  
  xhrFile: function(url, cb, binary) {
    var http = new XMLHttpRequest();
    http.open('get', url, true);
    if (binary) {
      http.responseType = "blob"; 
    }
    http.onload = function(e) {
      var d = new Date(http.getResponseHeader('expires'));
      cb(http.status, http.response, d.getTime(), url);
    }
    http.send(null);
  },
  
  htmlToBlobUrl: function(html) {
    var blob = new Blob([html], {type: 'text/html'});
    return URL.createObjectURL(blob);
  },
  
  renderUrl: function() {
    var html = localStorage.getItem('RENDER_HTML');
    if (html === null) {
      util.xhrFile(util.RENDER_HTML_URL, function(status, resp){
        if (status == 200) {
          localStorage.setItem('RENDER_HTML', resp);
          var url = util.htmlToBlobUrl(resp);
          util.renderUrl = function(){
            return url;
          };  
        }
      });
      util.renderUrl = function(){
        return util.RENDER_HTML_URL;
      };  
      return util.RENDER_HTML_URL;
    } else {
      var url = util.htmlToBlobUrl(html);
      util.renderUrl = function(){
        return url;
      };
      return url;
    }
  },

  postToUrl: function(path, params, method) {
    method = method || "post"; // Set method to post by default, if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
  }
};
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
    getAbsoluteUrl: function(el) {
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
  },
  'LINK': {
    getUrl: function(el) {
      return el.getAttribute('href');
    },
    getAbsoluteUrl: function(el) {
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
      return false;
    }
  }
};//     validator.js
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
};//     cache.js
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
    } else if (result.expiry > Date.now()) {
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
  
  // Get file keyed by provided key
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





function Net () {
}

Net.prototype.xhrGet = function (url, cb, binary) {
  var http = new XMLHttpRequest();
  http.open('get', url, true);
  if (binary) {
    http.responseType = binary; 
  }
  http.onload = function(e) {
    if (http.status == 200) {
      // Get cache expiration time
      var cur = Date.now();
      var re = /max\-age=([0-9]+)/gi.exec(http.getResponseHeader('Cache-control'));
      var maxage = 0;
      if (re && re[1]) {
        maxage = re[1] * 1000 + cur;
      }
      var expires = (new Date(http.getResponseHeader('Expires'))).getTime();
      var file = {data: http.response, expiry: Math.max(expires, maxage)};
      cb(null, file);
    } else {
      cb(new Error(http.status), null);
    }
  }
  http.send(null);
};

Net.prototype.peerGet = function (url, cb) {
  // Temporarily just use XHR
  this.xhrGet(url, cb, 'arraybuffer');
};
//     parser.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Parser for arbitrary HTML string to find its peer-downloadable assets

function PageParser(html) {
  // Contructor
  // ==========
  this._html = html;
  
  // Mapping of URLs to list of DOM elements that require it
  this.resources = {};
  
  // Parsing HTML into DOM tree
  this._parse();
  
  // Extract parseable resources
  this._extract();
}


// _parse
// =======
// **_parse ( )**
//
// Parse HTML by creating virtual DOM element
PageParser.prototype._parse = function() {
  this.dom = document.implementation.createHTMLDocument('');
  this.dom.documentElement.innerHTML = this._html;
}

// _extract
// =======
// **_extract ( )**
//
// Query for selected HTML elements and call corresponding handler functions
PageParser.prototype._extract = function() {
  var els = this.dom.querySelectorAll('img, link');
  // Loop through elements and switch on tag name
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    // Get the URL and add it to resources
    var url = Renderer[el.tagName].getUrl(el);
    if (url && Validator.validateResource(url)) {
      this._addURL(util.absoluteURL(url), el);
    }
  }
};

// _addURL
// =======
// **_addURL ( url , el )**
//
// Adds a given URL and DOM element to downloadable resources
PageParser.prototype._addURL = function(url, el){
  if (!this.resources[url]) {
    this.resources[url] = [];
  }
  this.resources[url].push(el);
};

/*
PageParser.prototype._handleScript = function() {
  var els = document.querySelectorAll('img');
}

PageParser.prototype._handleLink = function() {
  var els = document.querySelectorAll('img');
}*/
 //     prefetcher.js
//     http://github.com/ericz/pjs
//     (c) 2013 Eric Zhang
//
// Finds anchor links on current page and prefetch resources on those links

function Prefetcher () {
  // Contructor
  // ==========
  
  var self = this;
  
  // Mapping of prefetched urls to PageParser generated DOM
  this._pages = {};
  
  // Mapping of all anchor tag destinations on this page to array of anchor tag DOM elements
  this._links = {};
  
  // Mapping of resource URLs to resource objects:  
  //
  //   resource: `{ elements: [], status: status }`
  //
  //   status: One of `Prefetcher.STATUS_NEW` `Prefetcher.STATUS_DOWNLOADING` `Prefetcher.STATUS_COMPLETE`
  this._resources = {};
  
  // Interface for downloading files peer-to-peer and with XHR
  this._net = new Net();
  
  // Browser cache
  this._cache = new PrefetcherCache(function(err, db){
    // DB is open
    if (err) {
      return;
    }
    self._findLinks();
  });
  
}

// Resource has not begun to be downloaded
Prefetcher.STATUS_NEW = 0;

// Resource is currently being downloaded
Prefetcher.STATUS_DOWNLOADING = 1;

// Resource is downloaded and available
Prefetcher.STATUS_COMPLETE = 2;

// _findLinks
// =======
// **_findLinks ( )**
//
// Query document for anchor tags and pass to _getLink
Prefetcher.prototype._findLinks = function(){
  var els = document.querySelectorAll('a');
  
  
  for (var i = 0; i < els.length; i++) {
    var url = els[i].href;
    // Call link validator to determine if we should prefetch the link
    if (Validator.validatePrefetchLink(els[i])) {
      if (!this._links[url]) {
        this._links[url] = [];
      }
      this._links[url].push(els[i]);
    }
  }
  
  
  // This is a good place to determine strategy for prefetching links
  
  var links = Object.keys(this._links);
  // Loop through links and begin prefetching
  for (var i = 0; i < links.length; i++) {
    // Let _getLink handle it from here
    this._getLink(links[i]);
  }
};

// _getLink
// =======
// **_getLink ( url )**
//
// Download given HTML link, store its DOM representation, and pass to _handleLink
Prefetcher.prototype._getLink = function(url){

  util.log('Prefetching link', url);

  var self = this;
  this._net.xhrGet(url, function(err, file){
    if (err) {
      return;
    }
    var parser = new PageParser(file.data);
    // Store the parsed DOM
    var dom = parser.dom;
    dom._url = url;
    self._pages[url] = dom;
    // Handle the parsed resources
    self._handleLink(parser.resources);
    // Write the new DOM into page cache
    self._writePage(url);
    // Replace the link on current page with page cache link
    self._replaceLink(url);
  });
};

// _handleLink
// =======
// **_handleLink ( url )**
//
// Start downloading resources for given url and parser
Prefetcher.prototype._handleLink = function(newResources){
  
  util.log('Got resources', newResources);
  
  var urls = Object.keys(newResources);
  // This is a good place to determine which resources on prefetched links to download
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (this._resources[url]) {
      var resource = this._resources[url];
      resource.elements = resource.elements.concat(newResources[url]);
      if (resource.status === Prefetcher.STATUS_COMPLETE) {
        this._setPrefetchedElements(newResources[url]);
      }
    } else {
      // We haven't seen this resource yet
      this._handleNewResource(url, newResources[url]);
    }
  }
};

Prefetcher.prototype._handleNewResource = function(url, els) {
  var self = this;
  
  var resource = {
    elements: els,
    status: Prefetcher.STATUS_NEW
  };
  this._resources[url] = resource;
  
  // Mark this file as being donwloaded
  resource.status = Prefetcher.STATUS_DOWNLOADING;
  // Get the file via P2P
  
  this._cache.hasFile(url, function(err, has) {
    if (has) {
      util.log('Found previously cached resource', url);
      resource.status = Prefetcher.STATUS_COMPLETE;
      self._setPrefetchedElements(resource.elements);
    } else {
      util.log('Getting file by peer', url);
      self._net.peerGet(url, function(err, file) {
        if (err) {
          return;
        }
        self._cache.writeFile(url, file.expiry, file.data);
        resource.status = Prefetcher.STATUS_COMPLETE;
        self._setPrefetchedElements(resource.elements);
      }); 
    }
  });
}

// _setPrefetchedElements
// =======
// **_setPrefetchedElements ( els )**
//
// Marks elements are prefetched so render.html knows what to do and update page in page cache
Prefetcher.prototype._setPrefetchedElements = function(els){
  var pages = {};
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    // Stow would disable the element
    Renderer[el.tagName].stowUrl(el);
    el.dataset.prefetched = true;
    pages[el.ownerDocument._url] = true;
  }
  // Update affected pages
  var pageUrls = Object.keys(pages);
  for (var i = 0; i < pageUrls.length; i++) {
    this._writePage(pageUrls[i]);
  }
};

// _fillElements
// =======
// **_fillElements ( url , els)**
//
// Assign the given URL to the given elements
Prefetcher.prototype._fillElements = function(url, els){
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    Renderer[el.tagName].setUrl(el, url);
  }
};

// _writePage
// =======
// **_writePage ( url )**
//
// Write the DOM for the given URL into page cache
Prefetcher.prototype._writePage = function(url) {

  util.log('Writing page', url);

  var dom = this._pages[url];
  var html = dom.documentElement.innerHTML; /* TODO  Does using innerHTML (excludes the <html> tag) fuck anything up? */
  
  try {
    // Write in localStorage for bonus performance
    localStorage.setItem(url, html);
  } catch (e) {
    // Local storage full, write into indexedDB
    this._cache.writePage(url, html);
  }
};

// _replaceLink
// =======
// **_replaceLink ( url )**
//
// Replace the link on current page with the render.html link
Prefetcher.prototype._replaceLink = function(url){
  
  util.log('Replacings links to', url);
  
  var fileUrl = util.renderUrl() + '#' + url; /* TODO  Support Firefox by not using Blob URL*/
  this._fillElements(fileUrl, this._links[url]);
};


exports.Prefetcher = Prefetcher;

})(this);
