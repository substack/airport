var airport = require('../../');
var air = airport('localhost', 9090);

var up = air.connect('beep');
setInterval(function () {
    up(function (remote) {
        remote.fives(11, function (n) {
            console.log('fives(11) : ' + n);
        });
    });
}, 1000);
