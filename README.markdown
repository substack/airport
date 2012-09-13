airport
=======

Provide an
[upnode](https://github.com/substack/upnode)-style
[dnode](https://github.com/substack/dnode) connection using service names from a
[seaport](https://github.com/substack/seaport) server.

Instead of connecting and listening on hosts and ports, you can .connect() and
.listen() on service semvers.

[![build status](https://secure.travis-ci.org/substack/airport.png)](http://travis-ci.org/substack/airport)

![airport](http://substack.net/images/airport.png)

example
=======

beep.js

``` js
var airport = require('airport');
var air = airport('localhost', 9090);

air(function (remote, conn) {
    this.fives = function (n, cb) { cb(n * 5) }
}).listen('beep');
```

connect.js

``` js
var airport = require('airport');
var air = airport('localhost', 9090);

var up = air.connect('beep');

setInterval(function () {
    up(function (remote) {
        remote.fives(11, function (n) {
            console.log('fives(11) : ' + n);
        });
    });
}, 1000);
```

First start a seaport server:

```
$ seaport 9090
seaport listening on :9090
```

then fire up the beep server:

```
$ node beep.js
```

and spin up the beep client:

```
$ node connect.js
fives(11) : 55
fives(11) : 55
fives(11) : 55
fives(11) : 55
```

If you kill the beep server and bring it up again, the connection requests get
queued and fire when the beep server comes back up, even though it got assigned
a different port!

methods
=======

```
var airport = require('airport');
var seaport = require('seaport');
var ports = seaport.connect(...);
```

var air = airport(ports)
------------------------

Return a new airport object `air` from a seaport port allocation object `ports`.

var air = airport(...)
----------------------

Create a new seaport `ports` object from the arguments provided and use that as
a shorthand to return `airport(ports)`.

var up = air(fn).connect(role)
------------------------------

Return a new [upnode](https://github.com/substack/upnode) connection to a
service that fulfills `role` with the optional upnode function `fn`.

If no services for `role` are availble right away the request will be queued
until a service for `role` comes online.

When the connection drops and reconnection fails, seaport will be queried for a
new host/port endpoint.

`air.connect()` works as a shortcut for `air().connect()` just like in upnode.

air(fn).listen(role, opts={})
-----------------------------

Create a new upnode service given the dnode constructor function or object `fn`
for the given `role`.

If you specify a secret phrase in `opts.secret`, that phrase will be put in the
seaport metadata for your service and clients that `.connect()` will need to
authenticate with the secret phrase. This is performed automatically with
`air.connect()`.

You can pass metadata directly through `opts.meta`.

install
=======

With [npm](http://npmjs.org) do:

```
npm install airport
```

license
=======

MIT/X11
