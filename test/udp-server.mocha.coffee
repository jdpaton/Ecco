fs = require 'fs'
assert = require 'assert'
constants = require '../lib/constants'

Ecco = require '../index'
EccoServer = require '../lib/server/udp-server'
EccoClient = require '../lib/client'

# avoid nodejs EE leak warning when running simultaneous tests
process.stdout.setMaxListeners 100

describe 'test the UDP Ecco server', ->

  beforeEach ->
    delete process.env['ECCO_PORT']

  it 'should start', ->

    new EccoServer( { port: 6000 } ).start()

  it 'should respond on port 6001', ->

    new EccoServer( { port: 6001 } ).start()
    new EccoClient( { port: 6001, quiet: true, protocol: constants.UDP } ).start()

  it 'should respond on port 7000 with address argument 127.0.0.1', ->

    new EccoServer( { port: 7000, address: '127.0.0.1' } ).start()
    new EccoClient( 
      port: 7000
      address: '127.0.0.1'
      quiet: true
      protocol: constants.UDP
    ).start()

  it 'should respond on port 7001 with a start callback', (done) ->

    new EccoServer( { port: 7001 } ).start ->
      new EccoClient( { port: 7001, quiet: true, protocol: constants.UDP } ).start()
      done()

  it 'should listen on an IPv6 address', (done) ->
    ipv6_addr = "::1"

    new EccoServer( { address: ipv6_addr, port: 3008 } ).start ->
      new EccoClient( { address: ipv6_addr, port: 3008, protocol: constants.UDP } ).start ->
        done()


  it 'should start and emit a listening event', (done) ->

    server = new EccoServer( { port: 6002 } )

    server.on 'listening', ->
      done()

    server.start()

  it 'should start, stop and then emit a close event', (done) ->

    server = new EccoServer( { port: 6003 } )

    server.on 'listening', ->
      server.stop()

    server.on 'close', ->
      done()

    server.start()

  it 'should start, receive a new connection and emit message event',
  (done) ->

    server = new EccoServer( { port: 6004 } )

    server.on 'listening', ->
      client = new EccoClient( { port: 6004, quiet: true, protocol: constants.UDP } )
      client.start()
      client.send 'foo'

    server.on 'message', (socket) ->
      assert(socket)
      done()

    server.start()

  it 'should start, receive a new connection and data', (done) ->

    server = new EccoServer( { port: 6005 } )

    server.on 'listening', ->
      client = new EccoClient( { port: 6005, quiet: true, protocol: constants.UDP} )

      client.on 'connected', ->
        client.send 'test data'

      client.start()

    server.on 'message', (msg, client) ->
      assert(msg.toString() == 'test data')
      done()

    server.start()

  # This test actually passes on node.js in the dgram module :\
  # If the port is invalid node will assign it an ephemeral port
  #it 'should emit an error event with an invalid port', (done) ->

  #  server = new EccoServer( { port: '!!--rere3423432//\\', quiet: true } )

  #  server.on 'error', (e)->
  #    assert(e.code == 'EACCES')
  #    done()

  #  server.start()

  it 'should write received data to a file', (done) ->

    this.timeout 5000

    test_str = '٩(-̮̮̃-̃)۶ ٩(●̮̮̃•̃)۶ ٩(͡๏̯͡๏)۶ ٩(-̮̮̃•̃).'
    test_file = '/tmp/ecco-test-udp.dat'

    server = new EccoServer(
      port: 6007
      quiet: true
      timeout: 3000
      'out-file': test_file
      protocol: constants.UDP
    )

    server.on 'listening', ->
      client = new EccoClient( { port: 6007, quiet: true, protocol: constants.UDP } )
      client.start ->

        setTimeout ->
          client.send test_str, ->
            # allow time for the server to write to the file
            setTimeout ->
              fs.readFile test_file, (err, data)->
                done(err) if err
                assert data.toString() == test_str

                fs.unlink test_file, (err) ->
                  done(err)
            , 500
        , 3000

    fs.exists test_file, (exists) ->
      if exists
        fs.unlink test_file
      server.start()

  it 'should error when no options are passed to the constructor', (done) ->

    try
      server = new Ecco().Server()
      done new Error('Failed to raise an error with empty options passed')
    catch error
      assert error
      done()

  # Run this test last, or in a separate file. It modifies ENV vars at runtime.
  it 'should connect to server and NOT error when no options are passed to ' +
     'the constructor but $ECCO_PORT is set', (done) ->

      process.env['ECCO_PORT'] = 7656

      try
        server = new Ecco().Server()
        assert server.opts.port == 7656

        server.on 'listening', ->
          done()

        server.on 'error', (e) ->
          done(e)

        server.start()

      catch error
        done(error)










