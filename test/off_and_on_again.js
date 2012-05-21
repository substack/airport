var test = require('tap').test;
var seaport = require('seaport');
var spawn = require('child_process').spawn;

test('turn it off and on again', function (t) {
    t.plan(1);
    
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    var server = seaport.createServer();
    server.listen(port);
    
    function sh (file) {
        var args = [ __dirname + '/off_and_on_again/' + file, port ];
        return spawn(process.execPath, args);
    }
    
    var ps = {
        server : sh('server.js'),
        client : sh('client.js'),
    };
    
    var data = '';
    ps.client.stdout.on('data', function (buf) { data += buf });
    function checkOutput () {
        t.same(data.split(/\r?\n/), [ 'up', 'down', 'up', 'down', '' ]);
    }
    
    ps.client.stdout.once('data', function (buf) {
        ps.client.stdout.once('data', function (buf) {
            ps.server = sh('server.js');
            
            ps.client.stdout.once('data', function (buf) {
                setTimeout(function () {
                    ps.server.kill();
                    
                    ps.client.stdout.once('data', function (buf) {
                        setTimeout(checkOutput, 2 * 1000);
                    });
                }, 2 * 1000);
            });
        });
        
        setTimeout(function () {
            ps.server.kill();
        }, 50);
    });
    
    t.on('end', function () {
        server.close();
        ps.server.kill();
        ps.client.kill();
    });
});
