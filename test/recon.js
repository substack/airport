var test = require('tap').test;
var spawn = require('child_process').spawn;
var airport = require('airport');
var seaport = require('seaport');
var port = Math.floor(Math.random() * 5e4 + 1e4);

function createHub () {
    return spawn(process.execPath, [
        __dirname + '/../node_modules/.bin/seaport',
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
    setTimeout(function () {
        ps.kill();
        setTimeout(function () {
            if (ref.stopped) return;
            ref.stop = runProc(fn).stop;
        }, 1000);
    }, 1500);
    
    var ref = {};
    ref.stop = function () {
        ref.stopped = true;
        ps.kill();
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
                results.push(s);
            });
        });
    }, 100);
    
    setTimeout(function () {
        t.ok(results.length > 10 * 2, 'enough initial events');
        clearInterval(iv);
        
        up(function (remote) {
            remote.beep(function (s) {
                t.ok(s);
                results.push(s);
            });
        });
    }, 10 * 1000);
    
    var server = runProc(createServer);
    var hub = runProc(createHub);
    t.on('end', function () {
        server.stop();
        hub.stop();
        if (up.close) up.close();
        setTimeout(process.exit, 1000);
    });
});
