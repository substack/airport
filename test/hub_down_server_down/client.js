var air = require('../../')(process.argv[2]);
var up = air.connect('beep');
up.on('up', function () { console.log('up') });
up.on('down', function () { console.log('down') });
