#!/usr/bin/env node
var fs = require('fs');
var seaport = require('seaport');
var ports = seaport.connect(process.argv[2]);

var airport = require('../../');
var air = airport(ports);

air(function () {}).listen('beep');
