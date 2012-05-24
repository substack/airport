var test = require('tap').test;
var seaport = require('seaport');
var spawn = require('child_process').spawn;

test('hub goes down, server goes down', function (t) {
    t.plan(1);
    
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    
    function sh (file) {
        var args = [ __dirname + '/hub_down_server_down/' + file, port ];
        var p = spawn(process.execPath, args);
        p.stderr.pipe(process.stderr, { end : false });
        return p;
    }
    
    var ps = {
        server : sh('server.js'),
        client : sh('client.js'),
        hub : sh('hub.js'),
    };
    
    var data = '';
    ps.client.stdout.on('data', function (buf) { data += buf });
    function checkOutput () {
        t.same(data.split(/\r?\n/), [ 'up', 'down', 'up', '' ]);
    }
    
    setTimeout(function () {
        ps.server.kill();
    }, 2 * 1000);
    
    setTimeout(function () {
        ps.hub.kill();
    }, 4 * 1000);
    
    setTimeout(function () {
        ps.hub = sh('hub.js');
    }, 6 * 1000);
    
    setTimeout(function () {
        ps.server = sh('server.js');
    }, 10 * 1000);
    
    setTimeout(function () {
        checkOutput();
    }, 15 * 1000);
    
    t.on('end', function () {
        ps.hub.kill();
        ps.server.kill();
        ps.client.kill();
    });
});
