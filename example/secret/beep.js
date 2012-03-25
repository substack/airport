var seaport = require('seaport');
var airport = require('../../');

var ports = seaport.connect('localhost', 9090);
var air = airport(ports);

air(function (remote, conn) {
    this.fives = function (n, cb) { cb(n * 5) }
}).listen('beep', { secret : 'boop' });
