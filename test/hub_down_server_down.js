var test = require('tap').test;
var seaport = require('seaport');
var spawn = require('child_process').spawn;
var split = require('split');

test('hub goes down, server goes down', function (t) {
    t.plan(3);
    
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
    ps.hub.stderr.pipe(process.stdout);
    
    var lines = [];
    ps.client.stdout.pipe(split()).on('data', function (buf) {
        var line = buf.toString('utf8');
        lines.push(line);
        
        if (lines.length === 1) {
            t.equal(line, 'up');
            ps.hub.kill();
            ps.server.kill();
        }
        else if (lines.length === 2) {
            t.equal(line, 'down');
            ps.hub = sh('hub.js');
            ps.hub.stdout.once('data', function () {
                setTimeout(function () {
                    ps.hub.kill();
                }, 1000);
                
                setTimeout(function () {
                    ps.hub = sh('hub.js');
                }, 1500);
                
                setTimeout(function () {
                    ps.server = sh('server.js');
                }, 2000);
            });
        }
        else if (lines.length === 3) {
            t.equal(line, 'up');
        }
    });
    
    t.on('end', function () {
        ps.hub.kill();
        ps.server.kill();
        ps.client.kill();
    });
});
