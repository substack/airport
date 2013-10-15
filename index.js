var upnode = require('upnode');
var seaport = require('seaport');
var EventEmitter = require('events').EventEmitter;
var pick = require('deck').pick;
var funstance = require('funstance');

var airport = module.exports = function (ports) {
    if (!ports || typeof ports.get !== 'function') {
        ports = seaport.connect.apply(null, arguments);
    }
    
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

Airport.prototype.connect = function (opts, fn) {
    var self = this;
    
    if (typeof opts === 'string') {
        opts = { role : opts };
    }
    var role = opts.role;
    var up = null;
    var connected = undefined;
    self.ports.on('connect', function () { connected = true });
    self.ports.on('disconnect', function () { connected = false });
    
    function scan () {
        if (closed) return;
        var ps = self.ports.query(role);
        if (ps.length === 0) return setTimeout(scan, 1000);
        
        var expired = false;
        var timeout = setTimeout(function () {
            expired = true;
            u.close();
            scan();
        }, 1000);
        var downTimeout;
        
        var s = pick(ps);
        var u = upnode.connect(s);
        u(function (ref) {
            if (expired) return;
            clearTimeout(timeout);
            
            if (s.secret && ref && typeof ref.secret === 'function') {
                ref.secret(s.secret, function (err, ref_) {
                    if (err) return target.emit('error', err);
                    up = function (cb) { cb(ref_) };
                    up.close = function () { u.close() };
                    
                    queue.forEach(function (cb) { cb(ref_) });
                    queue = [];
                    target.emit('up', ref_);
                });
            }
            else {
                queue.forEach(function (cb) { cb(ref) });
                queue = [];
                target.emit('up', ref);
                up = u;
            }
        });
        u.on('up', function (ref) {
            if (expired) return;
            clearTimeout(downTimeout);
        });
        u.on('down', function () {
            if (expired) return;
            target.emit('down');
            up = null;
            
            downTimeout = setTimeout(function () {
                expired = true;
                u.close();
                scan();
            }, 1500);
            
            target.once('close', function () {
                clearTimeout(downTimeout);
            });
        });
        target.once('close', function () { u.close() });
    }
    scan();
    
    var queue = [];
    var closed = false;
    
    var target = funstance(new EventEmitter, function (cb) {
        if (up) up(cb)
        else queue.push(cb)
    });
    
    target.close = function () {
        if (up) up.close();
        target.emit('close');
        closed = true;
    };
    
    return target;
};

Airport.prototype.listen = function () {
    var self = this;
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
    var meta = opts.meta || {};
    var cons = self.cons;
    
    if (opts.secret) {
        meta.secret = opts.secret;
        
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
    
    var em = new EventEmitter;
    
    var port = self.ports.register(opts.role, meta)
    var s = server.listen(port, opts.callback);
    em.close = s.close.bind(s);
    em._servers = server._servers;
    
    s.on('close', function () {
        self.ports.free(port);
        em.emit('close');
    });
    
    return em;
};
