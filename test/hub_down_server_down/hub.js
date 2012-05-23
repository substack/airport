var seaport = require('seaport');
var port = process.argv[2];
var server = seaport.createServer();
server.listen(parseInt(port, 10));
