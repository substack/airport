var test = require('tap').test;
var seaport = require('seaport');
var airport = require('../');

test('up down', function (t) {
    t.plan(5);
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
            beep.close();
            beep._servers[0].end();
            setTimeout(rebeep, 50);
        });
    });
    
    up.on('up', function (remote) {
        t.ok(remote.fives || remote.sixes);
    });
    
    up.on('down', function () {
        t.ok(true);
    });
    
    up.on('close', function () {
        t.end();
    });
    
    var beep = airport(ports.b)(function (remote, conn) {
        this.fives = function (n, cb) { cb(n * 5) }
    }).listen('beep');
    
    function rebeep () {
        beep = airport(ports.b)(function (remote, conn) {
            this.sixes = function (n, cb) { cb(n * 6) }
        }).listen('beep');
        
        up(function (remote) {
            remote.sixes(11, function (n) {
                t.equal(n, 66);
                up.close();
            });
        });
    }
    
    t.on('end', function () {
        ports.a.close();
        ports.b.close();
        
        server.close();
        beep.close();
    });
});
