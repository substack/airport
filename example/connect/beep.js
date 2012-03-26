var airport = require('../../');
var air = airport('localhost', 9090);

air(function (remote, conn) {
    this.fives = function (n, cb) { cb(n * 5) }
}).listen('beep');
