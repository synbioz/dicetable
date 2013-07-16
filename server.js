var http = require('http'),
    socketio = require('socket.io'),
    fs = require('fs');

function Server() {
}

Server.prototype.generateId = function(length) {
  var text = "";
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    var index = Math.floor(Math.random() * alphabet.length);

    text += alphabet.charAt(index);
  }

  return text;
}

Server.prototype.getUniquePath = function() {
  var id = this.generateId(8),
      path = '/' + id;

  while (io.sockets.manager.rooms[path] !== undefined) {
    id = generateId();
    path = '/' + id;
  }

  return path;
}

Server.prototype.rollDie = function(sides) {
  return 1 + Math.round((sides - 1) * Math.random());
}

Server.prototype.getHandler = function() {
  var self = this;

  return function(req, res) {
    if (req.url === '/') {
      res.setHeader('Location', self.getUniquePath());
      res.writeHead(302);
      res.end();
    } else {
      fs.readFile(__dirname + '/index.html', function(err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
      });
    }
  }
}

var server = new Server();
    app    = http.createServer(server.getHandler());
    io     = socketio.listen(app);

app.listen(3000);

io.sockets.on('connection', function(socket) {

  socket.on('subscribe', function(data) {
    socket.join(data.room);
  });

  socket.on('unsubscribe', function(data) {
    socket.leave(data.room);
  });

  socket.on('message', function(data) {
    io.sockets.in(data.room).emit('message', {message: {author: data.author, text: data.text}});
  });

  socket.on('roll', function(data) {
    var count = parseInt(data.count, 10),
        type  = parseInt(data.type,  10),
        results = [],
        total = 0;

    for (var i = 0; i < count; i++) {
      var result = server.rollDie(type);
      results.push(result);
      total += result;
    }

    io.sockets.in(data.room).emit('roll', {
      roll: {
        author: data.author,
        count: count,
        type: type,
        results: results,
        total: total
      }
    });
  });

});
