assert = require 'assert'

Ecco = require '../index'
EccoServer = require '../lib/server/tcp-server'
EccoClient = require '../lib/client'

port = 9000
server = new EccoServer( { port: port, echo: true } )
server.start() # server is stopped in the final test

# avoid nodejs EE leak warning when running parallel tests
process.stdin.setMaxListeners 100

describe 'test the Ecco client', ->

  beforeEach ->
    delete process.env['ECCO_PORT']

  it 'should start', ->

    new EccoClient( { port: port, quiet: true } ).start()

  it 'should start and emit connected event', (done) ->

    client = new EccoClient( { port: port, quiet: true } )

    client.on 'connected', ->
      done()

    client.start()

  it 'should connect with address argument 127.0.0.1', (done) ->

    client = new EccoClient( { port: port, address: '127.0.0.1', quiet: true } )

    client.on 'connected', ->
      done()

    client.start()

  it 'should start and callback', (done) ->

    client = new EccoClient( { port: port, address: '127.0.0.1', quiet: true } )

    client.on 'connected', ->
      done()

    client.start()


  it 'should start, connect and then emit an end event', (done) ->

    client = new EccoClient( { port: port, quiet: true } )

    client.on 'connected', ->
      client.conn.end()

    client.on 'end', ->
      done()

    client.start()

  it 'should start, send some data, and receive it back (echoed)',
  (done) ->

    client = new EccoClient(
      { port: port, quiet: true, 'disable-stdout': true }
    )

    client.on 'connected', ->
      client.conn.end()

    client.on 'data', (buf) ->
      assert(buf.toString() == 'test data')
      done()

    client.start()
    client.conn.write('test data')


  it 'should connect to a dead server and emit an error', (done) ->
    timeout = 5 * 1000
    this.timeout timeout + 5000

    server.stop ->
      client = new EccoClient( { port: port, quiet: true, timeout: timeout } )

      client.on 'error', (e) ->
        assert(e.code == "ECONNREFUSED")
        done()

      client.start()

  it 'should error when no options are passed to the constructor', (done) ->

    try
      new EccoClient()
    catch error
      assert error
      done()

  it 'should run a port scan', (done) ->
      this.timeout 60 * 1000

      server = new Ecco( { port: 3008 }).Server()

      server.on 'listening', ->
        client = new Ecco({port: "3000-4000"}).Client()
        client.start (open, errored) ->
          assert(open)
          assert(3008 in open)
          assert(errored.length > 1)
          server.stop()
          done()

      server.start()


  # Run this test last, or in a separate file. It modifies ENV vars at runtime.
  it 'should NOT error when no options are passed to the constructor ' +
    'but $ECCO_PORT is set', (done) ->

      process.env['ECCO_PORT'] = 4567

      server = new Ecco().Server()

      server.on 'listening', ->

        client = new Ecco().Client()

        client.on 'connected', ->
          done()

        client.start()

      server.on 'error', (e) ->
        done(e)

      server.start()

