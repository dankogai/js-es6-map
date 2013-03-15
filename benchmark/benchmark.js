/*
 * usage: node benchmark/benchmark.js
 */
(function(root){
    if (global.window) throw Error('please run with node.js');
    var assert = require('assert');
    var js_es6_map = require('../es6-map.js');
    // bummer. es6-shim does not return name space on require() !
    require('./es6-shim.js');
    var es6_shim   = global;
    var timeit = function(count, fun){
        var started = Date.now();
        var args = [].slice.call(arguments, 2);
        for (var i = 0; i < count; ++i) fun.apply(null, args);
        return Date.now() - started;
    };
    var namespaces = {'es6-shim':es6_shim, 'js-es6-map':js_es6_map};
    var bench_p = function(ns, sz){
        var m = ns.Map();
        for (var i = 0; i < sz; ++i) {
            m.set(i, i);
            m.set(''+i, ''+i);
        }
        assert.equal(m.size, 2*sz);
    };
    var bench_o = function(ns, sz){
        var m = ns.Map();
        for (var i = 0; i < sz; ++i) {
            m.set({}, {});
            m.set([], []);
        }
        assert.equal(m.size, 2*sz);
    };
    var benches = {primitives:bench_p, objects:bench_o};
    Object.keys(benches).forEach(function(b){
        console.log(b + ':');
        var bench = benches[b];
        [8,16,32,64,128,256,512,1024].forEach(function(s){
            console.log('\tsize:\t' + s*2);
            Object.keys(namespaces).forEach(function(k) {
                var ns = namespaces[k];
                var ms = timeit(100, bench, ns, s);
                console.log('\t\t' + k + ':\t' + ms);
            })
        })
    });
})(this);


