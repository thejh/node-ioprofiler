#! /home/jann/gitty/node/out/Release/node
var http = require('http')
  , FileServer = require('lightnode').FileServer
  , ioprofiler = require('./')
  , dnode = require('dnode')
  , net = require('net')

var server = new http.Server()
server.listen(4232)

var fileServer = new FileServer(__dirname+'/public/')
server.addListener('request', function(req, res) {
  if (require('url').parse(req.url).pathname !== '/dnode.js') {
    fileServer.receiveRequest(req, res)
  }
})

var dnodeServer = dnode(function(remote, conn) {
  var listener = function(events) {
    remote.handleEvents(events)
  }
  conn.on('ready', function() {
    ioprofiler.on('events', listener)
  })
  conn.on('end', function() {
    ioprofiler.removeListener('events', listener)
  })
})
dnodeServer.listen(server)

ioprofiler.on('events', function(events) {})


//// CHAT SERVER SECTION
var chatClients = []
var chatServ = net.createServer(function(con) {
  chatClients.push(con)
  con.on('end', function() {
    chatClients.splice(chatClients.indexOf(con), 1)
  })
  con.on('data', function(data) {
    chatClients.forEach(function(peer) {
      if (peer === con) return
      peer.write(data)
    })
  })
}).listen(4233)
