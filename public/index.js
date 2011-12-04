window.onload = function() {

//// CLASS: ConnectionList
// scaleFactor: scale factor [ms/px]
function ConnectionList(container, scaleFactor) {
    var self = this;
    
    this.container = container;
    this.connections = [];
    this.cons = {};
    this.scaleFactor = scaleFactor;
    this.startTime = Date.now();
    this.pixelShift = 0;
    
    setInterval(function() {
        self.updateTime(Date.now());
        self.connections.forEach(function(connection) {
            connection.tick();
        });
    }, 20);
}

ConnectionList.prototype.makeConnection = function(localport, remotehost, remoteport) {
    var con = new Connection(this, localport, remotehost, remoteport);
    this.container.appendChild(con.div);
    this.connections.push(con);
    return con;
};

ConnectionList.prototype.updateTime = function(time) {
    // [ms] / [ms/px] = [px]
    var Δtime = time - this.startTime;
    this.pixelShift = Δtime / this.scaleFactor;
};


//// CLASS Connection
function Connection(list, localport, remotehost, remoteport) {
  this.list = list
  this.id = ++Connection._id
  
  this.div = document.createElement('div')
  this.div.className = 'connection'
  
  var labelText = localport + '\n' + remotehost + ':' + remoteport
  this.labelDiv = document.createElement('div')
  this.labelDiv.className = 'connlabel'
  this.labelDiv.appendChild(document.createTextNode(labelText))
  this.div.appendChild(this.labelDiv)
}

Connection.prototype.addEvent = function(type, time) {
    var Δtime = time - this.list.startTime;
    var pos0 = -Δtime / this.list.scaleFactor;
    var right = pos0 + this.list.pixelShift;
    var div = document.createElement('div');
    div.setAttribute('data-pos0', pos0);
    div.className = type;
    div.style.right = right+'px';
    this.div.appendChild(div);
};

Connection.prototype.tick = function() {
    var self = this;
    var children = [].slice.call(this.div.children);
    children.forEach(function(child) {
        var pos0 = +child.getAttribute('data-pos0');
        if (pos0 == null) return
        var right = pos0 + self.list.pixelShift;
        child.style.right = right+'px';
        if (child.offsetLeft < 0) {
          self.div.removeChild(child)
          if (child.className === 'err') {
            // no more events here, drop it
            // TODO this part seems to be kinda un-decoupled to me
            delete self.list.cons[self.socketid]
            var index = self.list.connections.indexOf(self)
            if (index < 0) throw new Error("oh no, we're all gonna die!")
            self.list.connections.splice(index, 1)
            self.list.container.removeChild(self.div)
          }
        }
    });
};

Connection._id = 0;

// ============================================================

var body = document.getElementsByTagName('body')[0]
var conlist = new ConnectionList(body, 10)
//var con = conlist.makeConnection();
//con.addEvent('recv', +Date.now());
//con.addEvent('send', +Date.now()-2000);

DNode({handleEvents: function(events) {
  console.log(events.map(function(evt){return JSON.stringify(evt)}).join('\n'))
  events.forEach(function(event) {
    if (event.type === 'connect') {
      var con = conlist.makeConnection(event.localport, event.remotehost, event.remoteport)
      con.socketid = event.socket
      conlist.cons[event.socket] = con
    } else if (event.type === 'write') {
      var con = conlist.cons[event.socket]
      if (con) {
        con.addEvent('send', event.time)
      }
    } else if (event.type === 'data') {
      var con = conlist.cons[event.socket]
      if (con) {
        con.addEvent('recv', event.time)
      }
    } else if (event.type === 'close') {
      var con = conlist.cons[event.socket]
      if (con) {
        con.addEvent('err', event.time)
      }
    }
  })
}}).connect(function(){
  console.log('connected!')
})

}
