var fs = require('fs');
var net = require('net');
var util = require("util");
var events = require("events");

/**
 * Creates an instance of EccoServer
 *
 * @constructor
 * @this {TCPEccoServer}
 * @param {Object} opts Standard options object
 */
var TCPEccoServer = function(opts) {

    if(!(this instanceof TCPEccoServer)) {
        return new TCPEccoServer(opts);
    }

    events.EventEmitter.call(this);

    var self = this;
    this.opts = opts;

    this.server = net.createServer(function(c) {

        if(opts.timeout) {
            c.setTimeout(opts.timeout);
        }

        if (opts.v) {
            console.log('client connected');
        }

        c.on('end', function() {
            if (opts.v) {
                console.log('client disconnected');
            }
        });

        c.on('error', function(e) {
            if (!opts.quiet) {
                console.error('client error:', e);
            }
            self.emit('client-error', e, c);
        });

        c.on('timeout', function() {
            c.end();
            if (!opts.quiet) {
                console.error('client timeout:',
                    c.remoteAddress + ':' + c.remotePort);
            }
            self.emit('client-timeout', c);
        });

        // (opt) write out received data to a file stream in 'append' mode
        if (opts['out-file']) {
            var _out_file = fs.createWriteStream(opts['out-file'], {
                flags: 'a'
            }).on('error', function(e) {
                self.emit('error', e);
            });
            c.pipe(_out_file);
        }

        // (opt) echo received data back to the client
        if (opts.echo) {
            c.pipe(c).on('error', function(e) {
                self.emit('error', e);
            });
        }

        // (opt) supress logging received data stdout
        if (!opts['disable-stdout']) {
            c.pipe(process.stdout).on('error', function(e) {
                self.emit('error', e);
            });
        }


    });

    this.server.on('error', function(e) {
       self.emit('error', e);
    });

    this.server.on('connection', function(sock) {
        self.emit('connection', sock);
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

    return self;

};

util.inherits(TCPEccoServer, events.EventEmitter);

/**
 * Starts the listening socket
 *
 * @this {TCPEccoServer}
 * @param {Function} cb A callback called after the socket is listening.
 */
TCPEccoServer.prototype.start = function(cb) {

    var self = this;

    this.server.listen(this.opts.port, (this.opts.address || '127.0.0.1'),
        function() {
            self.emit('listening');
            if (cb) {
                return cb();
            }
        });

};

/**
 * Stops the listening socket
 *
 * @this {TCPEccoServer}
 * @param {Function} cb A callback called after the socket has been destroyed.
 */
TCPEccoServer.prototype.stop = function(cb) {
    if (this.server) {
        this.server.close();
    }
    if (cb) {
        return cb();
    }
};

module.exports = TCPEccoServer;
