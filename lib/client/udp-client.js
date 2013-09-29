var fs = require('fs');
var dgram = require('dgram');
var util = require("util");
var events = require("events");

var EccoServer = require('../server/udp-server');

/**
 * Creates an instance of an UDPEccoClient
 *
 * @constructor
 * @this {UDPEccoClient}
 * @param {Object} opts Standard options object, opts.port argument required.
 */
var UDPEccoClient = function(opts) {
    'use strict';
    if (!(this instanceof UDPEccoClient)) {
        return new UDPEccoClient(opts);
    }

    events.EventEmitter.call(this);

    this.opts = opts || {};

    return this;
};

util.inherits(UDPEccoClient, events.EventEmitter);

/**
 * Starts a port scan or single EccoClient instance depending on the arguments
 * provided.
 *
 * @this {UDPEccoClient}
 * @param {Function} cb A callback function called after the client has
 *                      connected to the server, or the port scan has
 *                      finished (optional).
 */
UDPEccoClient.prototype.start = function(cb) {
    'use strict';
    if (this.opts.port_scan === true) {
        var port_ranges = this.opts.port.split('-');
        return this.portScan(parseInt(port_ranges[0], 10),
            parseInt(port_ranges[1], 10), cb);

    } else {
        return this.connect(cb);
    }
};

/**
 * binds the UDP port to the remote server
 *
 * @this {UDPEccoClient}
 * @param {Function} cb A callback function called after the client has
 *                      connected to the server, or the port scan has
 *                      finished (optional).
 */
UDPEccoClient.prototype.connect = function(cb) {
    var self = this;
    this.client = new EccoServer({ port: 0, quiet: true });
    this.client.on('message', function(msg, rinfo) {
        self.emit('message', msg, rinfo);

        if (!self.opts['disable-stdout']) {
            console.log(msg.toString());
        }

    });
    this.client.on('error', function(err) {
        self.emit('error', err);
        if (!self.opts.quiet && self.opts.cli === true) {
            console.error('Client error:', e);
            process.exit(1);
        }

    });
    this.client.on('listening', function() {
        self.emit('connected', self.client);

        if(self.opts.cli === true && !self.opts.quiet) {
            console.log('Connected to: ' + self.opts.address + ':' +  self.opts.port);
        }
        process.stdin.on('data', function(chunk) {
            self.send(chunk);
        });

    });
    this.client.on('close', function() { self.emit('close'); });

    this.client.start(cb);

    return this.client;
};

/**
 * Send wrapper
 *
 * @this {UDPEccoClient}
 * @param {Function} cb A callback called after the message is sent.
 */
UDPEccoClient.prototype.send = function(msg, cb) {
    if (!this.client) {
        return cb(new Error('Client is not connected'));
    }
    msg = new Buffer(msg);
    return this.client.server.send(msg, 0, msg.length, this.opts.port, this.opts.host, cb);
};



module.exports = UDPEccoClient;

