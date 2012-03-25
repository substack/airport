var upnode = require('upnode');
var dnode = require('dnode');
var seaport = require('seaport');
var EventEmitter = require('events').EventEmitter;

var airport = module.exports = function (ports) {
    var self = function (cons) {
        return new Airport(ports, cons);
    };
    
    self.connect = function () {
        var x = self();
        return x.connect.apply(x, arguments);
    };
    
    self.listen = function () {
        var x = self();
        return x.listen.apply(x, arguments);
    };
    
    return self;
};

function Airport (ports, cons) {
    this.ports = ports;
    this.cons = cons;
}

Airport.prototype.connect = function (role, fn) {
    var ports = this.ports;
    var up = ports.up;
    var cons = this.cons;
    
    function ondown () {
        ports.get(role, onget);
    }
    ports.get(role, onget);
    
    function onget (ps) {
        up.removeListener('down', ondown);
        
        var inst = upnode(cons);
        if (ps[0].secret) {
            res = inst.connect(ps[0], function (remote, conn) {
                if (typeof remote.secret === 'function') {
                    remote.secret(ps[0].secret, function (err, r) {
                        if (err) target.emit('error', err)
                        else conn.emit('up', r)
                    });
                }
                else conn.emit('up', remote)
            });
        }
        else {
            res = inst.connect(ps[0], fn);
        }
        
        target.close = res.close.bind(inst);
        queue.forEach(function (cb) { res(cb) });
    }
    up.on('down', ondown);
    
    var res;
    var queue = [];
    
    var target = function (cb) {
        if (!res) queue.push(cb);
        else res(cb);
    };
    (function () {
        var em = new EventEmitter;
        Object.keys(EventEmitter.prototype).forEach(function (key) {
            target[key] = em[key].bind(em);
        });
    })();
    return target;
};

Airport.prototype.listen = function () {
    var opts = {};
    [].slice.call(arguments).forEach(function (arg) {
        if (typeof arg === 'object') {
            Object.keys(arg).forEach(function (key) {
                opts[key] = arg[key];
            });
        }
        else if (typeof arg === 'function') {
            opts.callback = arg;
        }
        else if (typeof arg === 'string') {
            opts.role = arg;
        }
    });
    
    var server;
    var meta = {};
    var cons = this.cons;
    
    if (opts.secret) {
        meta = { secret : opts.secret };
        
        server = upnode(function (remote, conn) {
            this.secret = function (key, cb) {
                if (typeof cb !== 'function') return
                else if (key !== opts.secret) cb('ACCESS DENIED')
                else if (typeof cons === 'function') {
                    var inst = {};
                    var res = cons.call(inst, remote, conn);
                    if (res !== undefined) inst = res;
                    cb(null, inst);
                }
                else cb(null, cons)
            };
        });
    }
    else {
        server = upnode(cons);
    }
    
    this.ports.service(opts.role, meta, function (port) {
        server.listen(port, opts.callback);
    });
    return server;
};
