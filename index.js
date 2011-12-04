var net = require('net'),
    domains = require('domains')
    EventEmitter = require('events').EventEmitter;

var eventsBuffer = [];
var nextId = 1;
var emitter = new EventEmitter;

module.exports = emitter;

function handle(data) {
  data.time = Date.now();
  eventsBuffer.push(data);
}

setInterval(function() {
  if (eventsBuffer.length !== 0) {
    emitter.emit('events', eventsBuffer);
    eventsBuffer = [];
  }
}, 1000);

net.Socket.eventDomains = true

net.Socket.addGenericListener('connect', function(socket) {
  socket._ioprofiler_id = nextId++;
  handle(
  { type: 'connect'
  , socket: socket._ioprofiler_id
  , localport: socket.address().port
  , remotehost: socket.remoteAddress
  , remoteport: socket.remotePort
  });
});

net.Socket.addGenericListener('close', function(socket) {
  handle({type: 'close', socket: socket._ioprofiler_id});
});

net.Socket.addGenericListener('data', function(socket, data, eventId) {
  handle({type: 'data', socket: socket._ioprofiler_id, dataLength: data.length, eventId: eventId});
});

net.Socket.addGenericListener('write', function(socket, data) {
  var domain = domains.getCurrent()
  var causeID = null
  do {
    if (!domain.isNetDataEventDomain) continue
    causeID = domain.eventId
    break
  } while (domain.callerDomain !== domain && (domain = domain.callerDomain))
  handle({type: 'write',  socket: socket._ioprofiler_id, dataLength: data.length, causeId: causeID});
});
