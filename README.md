# Ecco - a netcat type clone for Node.js

Ecco is the result of my search for a netcat clone that worked with
node.js as a requireable module and via a CLI counterpart. I couldn't locate
one, so I humbly present Ecco.

It aims to have feature parity with the popular
[netcat-openbsd](http://www.openbsd.org/cgi-bin/man.cgi?query=nc) program.
It's not quite there yet, but it works great as a TCP echo server right now,
and it uses node.js' streaming interfaces under the hood.

The primary advantage of Ecco over `netcat` lies in its ability to concurrently
handle simultaneous without forking an expensive sub process each time.

## Install
    npm install -g ecco

## CLI Usage
    ecco -h

    Usage:
    -------
    Client: $ ecco <PORT>
    Client: $ ecco --address 10.0.0.1 <PORT>

    Server: $ ecco -l <PORT>
    Server: $ ecco -l --address 0.0.0.0 --out-file /tmp/ecco-recv.txt <PORT>

    -h                       This help screen
    -l / --listen                 Start a listening server
    -p / --port <PORT>   The server port
    -q / --quiet                   Supress output
    -v / --verbose               Increase output verbosity
    -u / --udp             UDP Mode
    --address <HOST>       The address to serve or connect upon
    --disable-stdout       Supress logging of ingress/egress data to stdout
    --echo                           If in listen mode, echo back received data to the client
    --timeout <TIMEOUT>    Sets the idle socket timeout on server/client connections (ms)
    --version                 Prints the version and exits
    --out-file <FILE PATH> If in listen mode, write all received data to this file

### Pipe across the network

You can send things to `stdin` and the client will stream it to the server:

    $ ecco -l --out-file /data/backup/file.txt 9000

    $ cat file.txt | ecco --address backup-server.com 9000

### Echo server

A simple TCP echo server with a one minute connection timeout, by default there
is no socket timeout:

    $ ecco -l --echo --timeout 60000 9000

### Port scanner

You can also run a simple port scan by supplying a range of ports instead:

    $ ecco 3000-4000

The port scanner has a default timeout of two seconds for each port, modifiable
with the `--timeout` argument (ms).


## Module usage

### Server (TCP)

    var Ecco = require('ecco');

    var server = new Ecco( { port: 3000, echo: true } ).Server();

    server.on('error', function(e){
        console.log(e);
    });

    server.on('client-error', function(e){
        console.error(e);
    });

    server.on('client-timeout', function(client_sock){
        console.log('Client timed out:', client_sock.remoteAddress)
    });

    server.start(function(){
        console.log('server is listening on port:', server.opts.port);
    });


### Client (TCP)

    var client = new Ecco( { port: 3000, protocol: "UDP" } ).Client();

    client.on('connected', function(){
        client.conn.write(data);
    })

    client.on('error', function(e){
        console.error(e);
    })

    client.start()

### UDP Client & Server
    server = new EccoServer( { port: 6005 } )

    server.on 'listening', ->
      client = new EccoClient( { port: 6005, quiet: true, protocol: "UDP" } )

      client.on 'connected', ->
        client.send 'test data'

      client.start()

    server.on 'message', (msg, client) ->
      console.log(msg.toString(), client.remoteAddress, client.remotePort);

    server.start()

Also see the `tests/*` files for more involved usage with other arguments.

## TODO

If you want to take a shot at any of these, I would be happy to accept a PR.

- run system binary command on each new connection
- run both TCP & UDP in one server
- debug mode support


