var airport = require('airport');
var air = airport('localhost', Number(process.argv[2]));
var ix = 0;

return air(function () {
    this.beep = function (cb) {
        if (typeof cb === 'function') {
            var xs = 'boop'.split('');
            xs[ix] = xs[ix].toUpperCase();
            ix = (ix + 1) % xs.length;
            cb(xs.join(''));
        }
    };
}).listen('q');
