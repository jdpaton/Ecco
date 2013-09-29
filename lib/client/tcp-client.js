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
    'use strict';
    if (!(this instanceof EccoClient)) {
        return new EccoClient(opts);
    }

    events.EventEmitter.call(this);

    this.opts = opts || {};
};

util.inherits(EccoClient, events.EventEmitter);

/**
 * Starts a port scan or single EccoClient instance depending on the arguments
 * provided.
 *
 * @this {EccoClient}
 * @param {Function} cb A callback function called after the client has
 *                      connected to the server, or the port scan has
 *                      finished (optional).
 */
EccoClient.prototype.start = function(cb) {
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
 * Creates an EccoClient and connects for each port in the supplied range
 *
 * @this {EccoClient}
 * @param {Integer} min The starting port number for the scan
 * @param {Integer} max The last port number for the scan
 * @param {Function} cb A callback function called after the client has
 *                      connected to the server (optional).
 */
EccoClient.prototype.portScan = function(min, max, cb) {
    'use strict';

    var self = this;
    var completed = 0;
    var errored_ports = [];
    var open_ports = [];
    var total_cycles = (max - min);

    function finish(cb) {

        // return the errored ports straight away in module mode
        if (!self.opts.cli) {
            return cb(open_ports, errored_ports);
        }

        if (!self.opts.quiet) {
            console.log('Number of open ports -> [' + open_ports.length + ']');
            // identify a list of common ports?
            console.log('Open ports:', open_ports);

            console.log('\nNumber of closed ports -> [' +  errored_ports.length + ']');
        }

        if (cb) {
            return cb(open_ports, errored_ports);
        } else {
            process.exit(0);
        }
    }

    function handleConnect(port) {
        var timeout = self.opts.timeout || (2 * 1000);

        var client = new EccoClient({
            port: port,
            'disable-stdout': true,
            timeout: timeout
        });

        client.connect(function() {
            client.stop();
            completed++;
            open_ports.push(client.opts.port);
            if (completed === total_cycles) {
                return finish(cb);
            }
        });

        client.on('error', function() {
            completed++;
            errored_ports.push(client.opts.port);
            if (completed === total_cycles) {
                return finish(cb);
            }
        });

    }

    for (var i = min; i <= max; i++) {
        handleConnect(i);
    }

};

/**
 * Creates a new socket and connects to the server (default: localhost)
 *
 * @this {EccoClient}
 * @param {Function} cb A callback function called after the client has
 *                      connected to the server.
 */
EccoClient.prototype.connect = function(cb) {
    'use strict';
    var client = this;

    if (!client.opts.quiet && client.opts.cli === true) {
        console.log('connecting to', this.opts.address + ':' +
            this.opts.port + '...');
    }

    var conn = this.conn = net.connect({
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
    'use strict';
    if (this.conn) {
        this.conn.end();
    }
};

module.exports = EccoClient;
