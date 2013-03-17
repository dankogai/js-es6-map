/*
 * $Id$
 *
 *  Licensed under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function(root) {
    'use strict';
    if (!Object.freeze || typeof Object.freeze !== 'function') {
        throw Error('ES5 support required');
    }
    // from ES5
    var create = Object.create,
    defineProperty = Object.defineProperty,
    defineProperties = Object.defineProperties,
    getOwnPropertyNames = Object.getOwnPropertyNames,
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getPrototypeOf = Object.getPrototypeOf,
    freeze = Object.freeze,
    isFrozen = Object.isFrozen,
    isSealed = Object.isSealed,
    seal = Object.seal,
    isExtensible = Object.isExtensible,
    preventExtensions = Object.preventExtensions,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    toString = Object.prototype.toString,
    isArray = Array.isArray,
    slice = Array.prototype.slice;
    // Utility functions
    var extend = function(dst, src) {
        getOwnPropertyNames(src).forEach(function(k) {
            defineProperty(
                dst, k, getOwnPropertyDescriptor(src, k)
            )
        });
        return dst;
    };
    var defaults = function(dst, src) {
        getOwnPropertyNames(src).forEach(function(k) {
            if (!hasOwnProperty.call(dst, k)) defineProperty(
                dst, k, getOwnPropertyDescriptor(src, k)
            );
        });
        return dst;
    };
    var defspec = extend( 
        create(null), getOwnPropertyDescriptor(Object, 'freeze')
    );
    delete defspec.value;
    var toSpec = function(v) { 
        return typeof(v) !== 'function' ? v
            : extend(extend(create(null), defspec), { value: v });
    };
    var defSpecs = function(src) {
        var specs = create(null);
        getOwnPropertyNames(src).forEach(function(k) {
            defineProperty(specs, k, toSpec(src[k]))
        });
        return specs;
    };
    var is = function (x, y) {
        return x === y
            ? x !== 0 ? true
            : (1 / x === 1 / y) // +-0
        : (x !== x && y !== y); // NaN
    };
    var isObject = function(o) { return o === Object(o) };
    var isPrimitive = function(o) { return o !== Object(o) };
    var isFunction = function(f) { return typeof(f) === 'function' };
    var signatureOf = function(o) { return toString.call(o) };
    var typeOf = function(o){ return o === null ? 'null' : typeof(o) };
    var HASWEAKMAP = (function() { // paranoia check
        try {
            var wm = WeakMap();
            wm.set(wm, wm);
            return wm.get(wm) === wm;
        } catch(e) {
            return false;
        }
    })();
    // Map
    var HASITERABLEMAP = (function(){
        if (!HASWEAKMAP) return false;
        return 'values' in Map();
    })();
    if (!HASITERABLEMAP) {
        var HASFOROF = (function(){
            try {
                eval('for(var i of [0,1]){}');
                return true;
            } catch(e) {
                // console.log(e);
                return false;
            }
        })();
        if (HASFOROF) { // like FireFox
            (function(specs){
                extend(Map.prototype, defSpecs(specs));
            })({
                items:eval([
                    '(function (){',
                    'var result = [];',
                    'for (var i of this) result.push(i);',
                    'return result;',
                    '})'
                ].join("\n")),
                keys:eval([
                    '(function (){',
                    'var result = [];',
                    'for (var i of this) result.push(i[0]);',
                    'return result;',
                    '})'
                ].join("\n")),
                values:eval([
                    '(function (){',
                    'var result = [];',
                    'for (var i of this) result.push(i[1]);',
                    'return result;',
                    '})',
                ].join("\n"))
            });
        } else { // anybody else
            var val2str = function(t, v) {
                switch (t) {
                case 'string':
                    return '.' + v;
                case 'number':
                    return (
                        0 > v ? ''
                            : Object.is(v, -0) ? '-'
                            : v >= 0 ? '+'
                            : ''
                    ) + v.toString(10);
                default:
                    return '' + v;
                }
            };
            var str2val = function(s) {
                switch (s[0]) {
                case '.':
                    return s.substr(1);
                case '+':
                case '-':
                case 'N': // NaN
                    return parseFloat(s, 10);
                case 't':
                    return true;
                case 'f':
                    return false;
                case 'u':
                    return undefined;
                case 'n':
                    return null;
                default:
                    throw new TypeError('unknown format:' + s);
                }
            };
            var indexOfIdentical = function(keys, k) {
                for (var i = 0, l = keys.length; i < l; i++) {
                    if (is(keys[i], k)) return i;
                }
                return -1;
            };
            var _Map = function _Map() {
                if (!(this instanceof _Map)) return new _Map();
                defineProperties(this, {
                    '__keys': { value: [] },
                    '__vals': { value: [] },
                    '__hash': { value: {} },
                    '__size': { value: 0, writable: true },
                    'size': {
                        get: function() {
                            return this.__size;
                        }
                    }
                });
            };
            defaults(_Map.prototype, defSpecs({
                has: function has(k) {
                    var t = typeOf(k),
                    s;
                    if (isPrimitive(k)) {
                        s = val2str(t, k);
                        return s in this.__hash;
                    }
                    return indexOfIdentical(this.__keys, k) >= 0;
                },
                get: function get(k) {
                    var t = typeOf(k),
                    i;
                    if (isPrimitive(k)) {
                        return this.__hash[val2str(t, k)];
                    } else {
                        i = indexOfIdentical(this.__keys, k);
                        return i < 0 ? undefined : this.__vals[i];
                    }
                },
                set: function set(k, v) {
                    var t = typeOf(k),
                    i, s;
                    if (isPrimitive(k)) {
                        s = val2str(t, k);
                        if (!(s in this.__hash)) this.__size++;
                        this.__hash[s] = v;
                    } else {
                        i = indexOfIdentical(this.__keys, k);
                        if (i < 0) {
                            this.__keys.push(k);
                            this.__vals.push(k);
                            this.__size++;
                        } else {
                            this.__keys[i] = k;
                            this.__vals[i] = v;
                        }
                    }
                },
                'delete': function (k) { // can't name it in JS
                    var t = typeOf(k),
                    i, s;
                    if (isPrimitive(k)) {
                        s = val2str(t, k);
                        if (s in this.__hash) {
                            delete this.__hash[s];
                            this.__size--;
                            return true;
                        }
                    } else {
                        i = indexOfIdentical(this.__keys, k);
                        if (i >= 0) {
                            this.__keys.splice(i, 1);
                            this.__vals.splice(i, 1);
                            this.__size--;
                            return true;
                        }
                    }
                    return false;
                },
                keys: function keys() {
                    var keys = [],
                    hash = this.__hash,
                    k;
                    for (k in hash) {
                        keys.push(str2val(k));
                    }
                    return keys.concat(this.__keys);
                },
                values: function values() {
                    var vals = [],
                    hash = this.__hash,
                    k;
                    for (k in hash) {
                        vals.push(hash[k]);
                    }
                    return vals.concat(this.__vals);
                },
                items: function items() {
                    var kv = [],
                    hash = this.__hash,
                    k, i, l;
                    for (k in hash) {
                        kv.push([str2val(k), hash[k]]);
                    }
                    for (i = 0, l = this.__keys.length; i < l; i++) {
                        kv.push([this.__keys[i], this.__vals[i]]);
                    }
                    return kv;
                },
                clear: function clear() {
                    var keys = this.keys();
                    while(keys.length) this.delete(keys.pop());
                }
            }));
            // Set
            var _Set = function _Set() {
                if (!(this instanceof _Set)) return new _Set();
                slice.apply(this, slice.call(arguments));
            };
            _Set.prototype = _Map();
            defaults(_Set.prototype, defSpecs({
                add: function(k) { 
                    _Map.prototype.set.apply(this, [k, true]) 
                },
                values: function() { 
                    return _Map.prototype.keys.apply(this) 
                }
            }));
            // native but incomplete so relocate
            if (HASWEAKMAP) {
                extend(_Map, {__Native__:Map});
                extend(_Set, {__Native__:Set});
            }
            // notice extend is used to override the original
            extend(root, defSpecs({
                Map: _Map,
                Set: _Set
            }));
        }
    }
})(this);
