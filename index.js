var net = require('net'),
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

net.Stream.addGenericListener('connect', function(socket) {
  socket._ioprofiler_id = nextId++;
  handle({type: 'connect', socket: socket._ioprofiler_id});
});

net.Stream.addGenericListener('close', function(socket) {
  handle({type: 'close', socket: socket._ioprofiler_id});
});

net.Stream.addGenericListener('data', function(socket, data) {
  handle({type: 'data', socket: socket._ioprofiler_id, dataLength: data.length});
});

net.Stream.addGenericListener('write', function(socket, data) {
  handle({type: 'write',  socket: socket._ioprofiler_id, dataLength: data.length});
});
