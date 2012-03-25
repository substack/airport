airport
=======

Role-based connections and listeners for
[upnode](https://github.com/substack/upnode)
using
[seaport](https://github.com/substack/seaport).

example
=======

beep.js

``` js
var seaport = require('seaport');
var airport = require('airport');

var ports = seaport('testing').connect('localhost', 9090);
var air = airport(ports);

air(function (remote, conn) {
    this.fives = function (n, cb) { cb(n * 5) }
}).listen('beep');
```

connect.js

``` js
var seaport = require('seaport');
var airport = require('airport');

var ports = seaport('testing').connect('localhost', 9090);
var air = airport(ports);

var up = air.connect('beep');
up(function (remote) {
    remote.fives(11, function (n) {
        console.log('fives(11) : ' + n);
    });
});
```

output

```
$ seaport 9090 &
[1] 11035
seaport listening on :9090
$ node connect.js &
[2] 7143
$ node beep.js &
[3] 9040
fives(11) : 55
$ 
```

methods
=======

```
var airport = require('airport');
var seaport = require('seaport');
var ports = seaport('staging').connect(...);
```

var air = airport(ports)
------------------------

Return a new airport object `air` from a seaport port allocation object `ports`.

var up = air(fn).connect(role)
------------------------------

Return a new [upnode](https://github.com/substack/upnode) connection to a
service that fulfills `role` with the optional upnode function `fn`.

If no services for `role` are availble right away the request will be queued
until a service for `role` comes online.

`air.connect()` works as a shortcut for `air().connect()` just like in upnode.

air(fn).listen(role, opts={})
-----------------------------

Create a new upnode service given the dnode constructor function or object `fn`
for the given `role`.

If you specify a secret phrase in `opts.secret`, that phrase will be put in the
seaport metadata for your service and clients that `.connect()` will need to
authenticate with the secret phrase. This is performed automatically with
`air.connect()`.

install
=======

With [npm](http://npmjs.org) do:

```
npm install airport
```

license
=======

MIT/X11
