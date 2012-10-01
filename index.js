var upnode = require('upnode');
var seaport = require('seaport');
var EventEmitter = require('events').EventEmitter;
var pick = require('deck').pick;

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
    var ports = this.ports;
    var cons = this.cons;
    if (typeof opts === 'string') {
        opts = { role : opts };
    }
    var role = opts.role;
    
    function ondown () {
        ports.get(role, onget);
    }
    ports.get(role, onget);
    
    function onget (ps) {
        //ports.removeListener('down', ondown);
        var s = pick(ps);
        
        if (res) res.destroy();
        res = connector(s, function f (s_) {
            if (res) res.destroy();
            res = connector(s_, f);
        });
        
        target.close = function () {
            target.emit('close');
            res.close();
        };
        queue.forEach(function (cb) { res(cb) });
        queue = [];
    }
    if (this._ondown) ports.removeListener('down', this._ondown);
    ports.on('down', ondown);
    this._ondown = ondown;
    
    function connector (service, cb) {
        var inst = upnode(cons);
        var c;
        if (opts.createStream) {
            service.createStream = opts.createStream.bind(inst, service);
        }
        
        if (service.secret) {
            c = inst.connect(service, function (remote, conn) {
                if (typeof remote.secret === 'function') {
                    remote.secret(service.secret, function (err, r) {
                        if (err) target.emit('error', err)
                        else conn.emit('up', r)
                    });
                }
                else conn.emit('up', remote)
            });
        }
        else {
            c = inst.connect(service, fn);
        }
        
        c.on('down', function () {
            c.alive = false;
            target.emit('down');
        });
        
        c.on('up', function (remote) {
            c.alive = true;
            queue.forEach(function (f) { c(f) });
            queue = [];
            target.emit('up', remote);
        });
        
        var pending = false;
        function onreconnect () {
            if (!active) return;
            if (pending) return;
            target.emit('reconnect');
            
            function onup () {
                if (!active || !pending) return;
                ports.get(role, withResults);
            }
            ports.once('up', onup);
            ports.get(role, withResults);
            
            function withResults (ps) {
                ports.removeListener('up', onup);
                
                if (!active) return;
                pending = false;
                var s = pick(ps);
                if (s.port !== service.port || s.host !== service.host
                || s.secret !== service.secret) {
                    if (!active) return;
                    c.close();
                    cb(s);
                }
            }
            pending = true;
        }
        c.on('reconnect', onreconnect);
        
        var active = true;
        c.destroy = function () {
            active = false;
            c.removeListener('reconnect', onreconnect);
        };
        
        return c;
    }
    
    var res;
    var queue = [];
    
    var target = function (cb) {
        if (!res) queue.push(cb);
        else if (!res.alive) queue.push(cb);
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
    
    self.ports.service(opts.role, meta, function (port) {
        var s = server.listen(port, opts.callback);
        em.close = s.close.bind(s);
        em._servers = server._servers;
        
        s.on('close', function () {
            self.ports.free(port);
            em.emit('close');
        });
    });
    
    return em;
};
