var test = require('tap').test;
var spawn = require('child_process').spawn;
var airport = require('../');
var seaport = require('seaport');
var port = Math.floor(Math.random() * 5e4 + 1e4);

function createHub () {
    return spawn(process.execPath, [
        __dirname + '/../node_modules/.bin/seaport',
        'listen',
        port
    ]);
}

function createServer () {
    return spawn(process.execPath, [
        __dirname + '/recon/server.js',
        port
    ]);
}

function runProc (fn) {
    var ps = fn();
    
    var ref = {};
    ref.restart = function (n) {
        ref.stopped = true;
        ps.kill('SIGKILL');
        setTimeout(function () {
            var ref_ = runProc(fn);
            ref.restart = ref_.restart;
        }, n);
    };
    return ref;
}

test('reconnection race', function (t) {
    t.plan(2);
    
    var air = airport('localhost', port);
    var up = air.connect('q');
    var results = [];
    
    var iv = setInterval(function () {
        up(function (remote) {
            remote.beep(function (s) {
                console.log('  ' + s);
                results.push(s);
            });
        });
    }, 100);
    
    setTimeout(function () {
        t.ok(results.length > 10 * 2, 'enough initial events');
        clearInterval(iv);
        console.log('--- mark ---');
        
        up(function (remote) {
            remote.beep(function (s) {
                t.ok(s);
                results.push(s);
            });
        });
    }, 10 * 1000);
    
    var server = runProc(createServer, 1200);
    var hub = runProc(createHub, 400);
    
    up(function (remote) {
        setTimeout(function () {
            hub.restart(1500)
        }, 10);
        
        setTimeout(function () {
            hub.restart(200);
        }, 1900);
        
        setTimeout(function () {
            server.restart(2500);
        }, 100);
        
        setTimeout(function () {
            server.restart(300);
        }, 2700);
        
        setTimeout(function () {
            server.restart(600);
        }, 2300);
    });
    
    t.on('end', function () {
        setTimeout(process.exit, 1000);
    });
});
