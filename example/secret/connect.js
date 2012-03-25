var seaport = require('seaport');
var airport = require('../../');

var ports = seaport.connect('localhost', 9090);
var air = airport(ports);

var up = air.connect('beep');
up(function (remote) {
    remote.fives(11, function (n) {
        console.log('fives(11) : ' + n);
    });
});
