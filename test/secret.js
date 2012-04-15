var test = require('tap').test;
var seaport = require('seaport');
var airport = require('../');
var upnode = require('upnode');

test('authenticated with secrets', function (t) {
    t.plan(3);
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    var server = seaport.createServer();
    server.listen(port);
    
    var ports = {
        a : seaport.connect('localhost', port),
        b : seaport.connect('localhost', port),
    };
    
    var up = airport(ports.a).connect('beep');
    up(function (remote) {
        remote.fives(11, function (n) {
            t.equal(n, 55);
        });
    });
    
    var beep = airport(ports.b)(function (remote, conn) {
        this.fives = function (n, cb) { cb(n * 5) }
    }).listen('beep', { secret : 'boop' });
    
    var u;
    ports.a.get('beep', function (s) {
        u = upnode.connect(s[0], function (remote, conn) {
            t.equal(typeof remote.secret, 'function');
            remote.secret('boop', function (err, res) {
                if (err) t.fail(err)
                else conn.emit('up', res)
            });
        });
        
        u(function (remote) {
            remote.fives(11, function (n) {
                t.equal(n, 55);
            });
        });
    });
    
    t.on('end', function () {
        ports.a.close();
        ports.b.close();
        up.close();
        
        server.close();
        beep.close();
        
        u.close();
    });
});
