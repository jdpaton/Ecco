var Server = require('./lib/server');
var Client = require('./lib/client');

/**
 * Creates an instance of Ecco
 *
 * @constructor
 * @this {Ecco}
 * @param {Object} opts Standard options object
 */
var Ecco = function(opts) {

    if (!(this instanceof Ecco)) {
        return new Ecco(opts);
    }

    this.opts = opts || {};

    if(!this.opts.port && process.env.ECCO_PORT) {
        this.opts.port = parseInt(process.env.ECCO_PORT, 10);
    }

    if(this.opts.version) {
        var version = require('./package').version;

        if(this.opts.cli) {
           console.log(version);
           process.exit();
        }else{
          return version;
        }
    }

    if (!this.opts.port && this.opts.cli) {
        console.error('Port must be provided (--port <PORT>)');
        process.exit(1);
    }else if (!this.opts.port){
        throw new Error('The "port" argument is required');
    }

};

/**
 * Creates a new Ecco listening server (cli)
 *
 * @return {EccoServer} The new Server object.
 */
Ecco.prototype.startServer = function() {
    return new Server(this.opts).start();
};

/**
 * Returns a new Ecco server instance (module)
 *
 * @return {EccoServer} The new Server object.
 */
Ecco.prototype.Server = function() {
    return new Server(this.opts);
};

/**
 * Creates a new Ecco client (cli)
 *
 * @return {EccoClient} The new Client object.
 */
Ecco.prototype.newClient = function() {
    return new Client(this.opts).start();
};

/**
 * Returns a new Ecco client instance (module)
 *
 * @return {EccoClient} The new Client object.
 */
Ecco.prototype.Client = function() {
    return new Client(this.opts);
};

module.exports = Ecco;
