var upnode = require('upnode');
var dnode = require('dnode');
var seaport = require('seaport');

var airport = module.exports = function (ports) {
    var self = function () {
        var args = [].slice.call(arguments);
        return new Airport(ports, args);
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

function Airport (ports, args) {
    this.ports = ports;
    this.args = args;
}

Airport.prototype.connect = function (role, fn) {
    var ports = this.ports;
    var up = ports.up;
    var args = this.args;
    
    function ondown () {
        ports.get(role, onget);
    }
    ports.get(role, onget);
    
    function onget (ps) {
        up.removeListener('down', ondown);
        
        var inst = upnode.apply(null, args);
        res = inst.connect(ps[0].host, ps[0].port, fn);
        
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
    
    var role = opts.role;
    var fn = opts.callback || function () {};
    var ports = this.ports;
    
    if (opts.secret) {
        
    }
    else {
        var server = upnode.apply(null, this.args);
    }
    
    ports.service(role, function (port) {
        server.listen(port, fn);
    });
    return server;
};
