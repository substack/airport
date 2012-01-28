var test = require('tap').test;
var seaport = require('seaport');
var airport = require('../');

test('connect with upnode', function (t) {
    t.plan(1);
    var port = Math.floor(Math.random() * 5e5 + 1e5);
    var server = seaport.createServer();
    server.listen(port);
    
    var ports = {
        a : seaport('staging').connect('localhost', port),
        b : seaport('staging').connect('localhost', port),
    };
    
    var up = airport(ports.a).connect('beep');
    up(function (remote) {
        remote.fives(11, function (n) {
            t.equal(n, 55);
            t.end();
            
            ports.a.close();
            ports.b.close();
            up.close();
            
            server.close();
            beep.close();
        });
    });
    
    var beep = airport(ports.b)(function (remote, conn) {
        this.fives = function (n, cb) { cb(n * 5) }
    }).listen('beep');
});
