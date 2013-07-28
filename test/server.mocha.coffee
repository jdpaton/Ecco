fs = require 'fs'
assert = require 'assert'

Ecco = require '../index'
EccoServer = require '../lib/server'
EccoClient = require '../lib/client'

# avoid nodejs EE leak warning when running simultaneous tests
process.stdout.setMaxListeners 100

describe 'test the Ecco server', ->

  beforeEach ->
    delete process.env['ECCO_PORT']

  it 'should start', ->

    new EccoServer( { port: 4000 } ).start()

  it 'should respond on port 3000', ->

    new EccoServer( { port: 3000 } ).start()
    new EccoClient( { port: 3000, quiet: true } ).start()

  it 'should respond on port 5000 with address argument 127.0.0.1', ->

    new EccoServer( { port: 5000, address: '127.0.0.1' } ).start()
    new EccoClient( { port: 5000, address: '127.0.0.1', quiet: true } ).start()

  it 'should respond on port 3001 with a start callback', (done) ->

    new EccoServer( { port: 3001 } ).start ->
      new EccoClient( { port: 3001, quiet: true } ).start()
      done()

  it 'should start and emit a listening event', (done) ->

    server = new EccoServer( { port: 3002 } )

    server.on 'listening', ->
      done()

    server.start()

  it 'should start, stop and then emit a close event', (done) ->

    server = new EccoServer( { port: 3003 } )

    server.on 'listening', ->
      server.stop()

    server.on 'close', ->
      done()

    server.start()

  it 'should start, receive a new connection and emit connection event',
  (done) ->

    server = new EccoServer( { port: 3004 } )

    server.on 'listening', ->
      new EccoClient( { port: 3004, quiet: true } ).start()

    server.on 'connection', (socket) ->
      assert(socket)
      done()

    server.start()

  it 'should start, receive a new connection and data', (done) ->

    server = new EccoServer( { port: 3005 } )

    server.on 'listening', ->
      client = new EccoClient( { port: 3005, quiet: true } )

      client.on 'connected', ->
        client.conn.write('test data')

      client.start()

    server.on 'connection', (socket) ->
      socket.on 'data', (buf) ->
        assert(buf.toString() == 'test data')
        done()

    server.start()

  it 'should emit an error event with an invalid port', (done) ->

    server = new EccoServer( { port: '!!--rere3423432//\\', quiet: true } )

    server.on 'error', (e)->
      assert(e.code == 'EACCES')
      done()

    server.start()

  it 'should time out an idle client with timeout option set', (done) ->
    this.timeout 10 * 1000

    server = new EccoServer( { port: 3006, quiet: true, timeout: 3000 } )

    server.on 'listening', ->
      new EccoClient( { port: 3006, quiet: true } ).start()

    server.on 'client-timeout', (client) ->
      assert(client.remoteAddress)
      done()

    server.on 'error', (e) ->
      done e

    server.start()

  it 'should write received data to a file', (done) ->

    test_str = '٩(-̮̮̃-̃)۶ ٩(●̮̮̃•̃)۶ ٩(͡๏̯͡๏)۶ ٩(-̮̮̃•̃).'
    test_file = '/tmp/ecco-test.dat'

    server = new EccoServer( { port: 3007, quiet: true, timeout: 3000, 'out-file': test_file } )

    server.on 'listening', ->
      client = new EccoClient( { port: 3007, quiet: true } )
      client.start ->

        client.conn.write test_str, ->

          # allow time for the server to write to the file
          setTimeout ->

            fs.readFile test_file, (err, data)->
              assert !err
              assert data.toString() == test_str

              fs.unlink test_file, (err) ->
                assert !err
                done()
          , 500



    server.on 'client-timeout', (client) ->
      assert(client.remoteAddress)
      done()

    fs.exists test_file, (exists) ->
      if exists
        fs.unlink test_file, ->
          server.start()
      else
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

      process.env['ECCO_PORT'] = 7654

      try
        server = new Ecco().Server()
        assert server.opts.port == 7654

        server.on 'listening', ->
          done()

        server.on 'error', (e) ->
          done(e)

        server.start()

      catch error
        done(error)










