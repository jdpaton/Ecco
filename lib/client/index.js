var fs = require('fs');
var net = require('net');
var util = require("util");
var events = require("events");
var constants = require('../constants');

var TCPClient = require('./tcp-client');
var UDPClient = require('./udp-client');

/**
 * Creates an instance of an EccoClient
 *
 * @constructor
 * @this {EccoClient}
 * @param {Object} opts Standard options object, opts.port argument required.
 */
var EccoClient = function(opts) {
    'use strict';
    if (!(this instanceof EccoClient)) {
        return new EccoClient(opts);
    }

    this.opts = opts || {};

    // port scanner mode
    if (typeof this.opts.port === 'string' &&
        this.opts.port.match(/^\d+-\d+$/)) {
        this.opts.port_scan = true;
        this.opts.timeout = opts.timeout || (2 * 1000);
    }

    if (!opts.address) {
        this.opts.address = '127.0.0.1';
    }

    if (!opts.protocol) {
        this.opts.protocol = constants.TCP;
    }

    var client = (this.opts.protocol === constants.TCP) ? TCPClient : UDPClient;
    this.client = client(opts);

    return this.client;

};

EccoClient.prototype.start = function (cb) {
    return this.client.start(cb);
};

EccoClient.prototype.send = function (msg, cb) {
    return this.client.send(msg, cb);
};

module.exports = EccoClient;
