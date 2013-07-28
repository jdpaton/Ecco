var fs = require('fs');
var net = require('net');
var util = require("util");
var events = require("events");

/**
 * Creates an instance of an EccoClient
 *
 * @constructor
 * @this {EccoClient}
 * @param {Object} opts Standard options object, opts.port argument required.
 */
var EccoClient = function(opts) {

    if (!(this instanceof EccoClient)) {
        return new EccoClient(opts);
    }

    events.EventEmitter.call(this);

    this.opts = opts || {};

    if (!opts.address) {
        this.opts.address = '127.0.0.1';
    }

};

util.inherits(EccoClient, events.EventEmitter);

/**
 * Creates a new socket and connects to the server (default: localhost)
 *
 * @this {EccoClient}
 * @param {Function} cb A callback function called after the client has
 *                      connected to the server.
 */
EccoClient.prototype.start = function(cb) {

    var client = this;

    if (!client.opts.quiet) {
        console.log('connecting to', this.opts.address + ':' +
            this.opts.port + '...');
    }

    this.conn = conn = net.connect({
            port: this.opts.port,
            host: this.opts.address
        },
        function() {
            if (client.opts.timeout) {
                this.setTimeout(client.opts.timeout);
            }

            client.emit('connected');

            if (client.opts.verbose) {
                console.log('connected to server');
            }
            process.stdin.pipe(conn);
            if (cb) {
                return cb();
            }
        });

    conn.on('data', function(data) {
        client.emit('data', data);
        if (!client.opts['disable-stdout']) {
            console.log(data.toString());
        }
    });

    conn.on('end', function() {
        client.emit('end');
        if (client.opts.verbose) {
            console.log('disconnected: connection closed by server');
        }
    });

    conn.on('close', function() {
        client.emit('close');
        if (client.opts.verbose) {
            console.log('disconnected: connection closed');
        }
    });

    conn.on('timeout', function() {
        client.conn.end();
        client.emit('timeout');
    });

    conn.on('error', function(e) {
        client.emit('error', e);
    });

    client.on('error', function(e) {
        if (!client.opts.quiet && client.opts.cli === true) {
            console.error('Client error:', e);
            process.exit(1);
        }
    });

};

/**
 * Flushes any remaining data to write and closes the socket.
 *
 * @this {EccoClient}
 * @param {Function} cb A callback function called after socket has closed.
 *
 */
EccoClient.prototype.stop = function(cb) {
    if (this.conn) {
        this.conn.close();
    }
};

module.exports = EccoClient;
