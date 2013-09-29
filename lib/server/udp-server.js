var fs = require('fs');
var dgram = require("dgram");
var util = require("util");
var events = require("events");

/**
 * Creates an instance of UDPEccoServer
 *
 * @constructor
 * @this {UDPEccoServer}
 * @param {Object} opts Standard options object
 */
var UDPEccoServer = function(opts) {

    if(!(this instanceof UDPEccoServer)) {
        return new UDPEccoServer(opts);
    }

    events.EventEmitter.call(this);

    var self = this;
    this.opts = opts;

    this.server = dgram.createSocket("udp4");

    this.server.on('message', function (msg, client) {

        if (opts.v) {
            console.log('message received from:', client.address, client.port);
        }

        // (opt) write out received data to a file stream in 'append' mode
        if (self.opts['out-file']) {

            self._out_file = self.outfile || fs.createWriteStream(opts['out-file'], {
                flags: 'a'
            }).on('error', function(e) {
                self.emit('error', e);
            }).on('open', function(fd){ /* */ });
           self._out_file.write(msg);
        }

        // (opt) echo received data back to the client
        if (opts.echo) {
            self.server.send(msg, 0 , msg.length, client.port, client.address);
        }

        self.emit('message', msg, client);
    });

    this.server.on('error', function(e) {
        self.emit('error', e);
    });

    this.server.on('close', function() {
        self.emit('close');
    });

    self.on('error', function(e) {
        if (!opts.quiet && opts.cli === true) {
            console.error(e);
            process.exit(1);
        }
    });

    return this;
};

util.inherits(UDPEccoServer, events.EventEmitter);

/**
 * Starts the listening socket
 *
 * @this {UDPEccoServer}
 * @param {Function} cb A callback called after the socket is listening.
 */
UDPEccoServer.prototype.start = function(cb) {

    var self = this;

    this.server.bind(this.opts.port, this.opts.address);

    this.server.on('listening', function() {

        if (self.opts.v) {
            console.log('Ecco UDP server listening on:', self.opts.address + ':' + self.opts.port);
        }
        self.emit('listening');
        if (cb) {
            return cb();
        }
    });

    if(cb) {
        this.server.once('error', cb);
    }

};


/**
 * Stops the listening socket
 *
 * @this {UDPEccoServer}
 * @param {Function} cb A callback called after the socket has been destroyed.
 */
UDPEccoServer.prototype.stop = function(cb) {
    if (this.server) {
        this.server.close();
    }
    if (cb) {
        return cb();
    }
};

module.exports = UDPEccoServer;
