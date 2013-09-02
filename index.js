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
        var ps = self.ports.query(role);
        if (ps.length === 0) return setTimeout(scan, 1000);
        var expired = false;
        var timeout = setTimeout(function () {
            expired = true;
            scan();
        }, 1000);
        
        var s = pick(ps);
        var u = upnode.connect(s);
        u(function (ref) {
            if (expired) return;
            clearTimeout(timeout);
            
            queue.forEach(function (cb) { cb(ref) });
            queue = [];
        });
        u.on('up', function () {
            if (expired) return;
            target.emit('up');
            up = u;
        });
        u.on('down', function () {
            if (expired) return;
            target.emit('down');
            up = null;
            expired = true;
            scan();
        });
    }
    scan();
    
    var queue = [];
    var target = new EventEmitter;
    
    target.close = function () {
        if (up) up.close();
    };
    
    return funstance(target, function (cb) {
        if (up) up(cb)
        else queue.push(cb)
    });
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
