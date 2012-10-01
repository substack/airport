var test = require('tap').test;
var seaport = require('seaport');
var spawn = require('child_process').spawn;

test('hub goes down, server goes down', function (t) {
    t.plan(2);
    
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
ps.client.stderr.pipe(process.stderr, { end : false });
    function checkOutput () {
console.dir(data); 
        t.same(data.split(/\r?\n/).slice(-3)[0], 'down');
        t.same(data.split(/\r?\n/).slice(-2)[0], 'up');
    }
    
    setTimeout(function () {
        ps.hub.kill();
        ps.server.kill();
    }, 1500);
    
    setTimeout(function () {
        ps.hub = sh('hub.js');
    }, 2.5 * 1000);
    
    setTimeout(function () {
        ps.hub.kill();
        ps.hub = sh('hub.js');
    }, 4 * 1000);
    
    setTimeout(function () {
        ps.server = sh('server.js');
    }, 4.5 * 1000);
    
    setTimeout(function () {
        checkOutput();
    }, 8 * 1000);
    
    t.on('end', function () {
        ps.hub.kill();
        ps.server.kill();
        ps.client.kill();
    });
});
