var air = require('airport')(7500);
var tls = require('tls');
var up = air.connect({
    role : 'time',
    createStream : function (service) {
        return tls.connect(service.port, service.host);
    }
});

setInterval(function () {
    up(function (remote) {
        remote.time(function (t) {
            console.log('time = ' + t);
        });
    });
}, 1000);
