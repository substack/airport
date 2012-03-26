var test = require('tap').test;
var seaport = require('seaport');
var airport = require('../');

test('up down', function (t) {
    t.plan(2);
    var port = Math.floor(Math.random() * 5e5 + 1e5);
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
    
    var beep = airport(ports.b)(function (remote, conn) {
        this.fives = function (n, cb) { cb(n * 5) }
    }).listen('beep');
    
    function rebeep () {
console.log('rebeep');
        beep = airport(ports.b)(function (remote, conn) {
            this.sixes = function (n, cb) { cb(n * 6) }
        }).listen('beep');
        
        up(function (remote) {
console.dir(remote);
            remote.sixes(11, function (n) {
                t.equal(n, 66);
                beep.close();
console.log('n=' + n);
                t.end();
            });
        });
    }
    
    t.on('end', function () {
        ports.a.close();
        ports.b.close();
        up.close();
        
        server.close();
        beep.close();
    });
});
