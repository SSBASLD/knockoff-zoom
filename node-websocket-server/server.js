//Import the required dependencies
var WebSocketServer = require('websocket').server;
var http = require('http');

//Create a http server with a simple request listener
  //A http server is simply a computer program that uses the response/request model implemented by the World Wide Web and the HTTP
var server = http.createServer(function (request, response) {
    //Log the time of the request
    console.log(new Date() + ' Received request for ' + request.url);
    response.writeHead(200);
    response.end();
});

//Starts the server and makes it listen on port 8080
server.listen(8080, function () {
    console.log(new Date() + ' Server is listening on port 8080');
});

/* Create a websocket server based on the http server. 
This means it can accept the requests of the http server */
let wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false,
});

//Might actually change this if we need to
function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

let keyInputs = [];
let controllerConnection;
let websiteConnection;

let websiteConnections = {};
let controllerConnections = {};

let connections = [];

wsServer.on('request', function (request) {
  let websiteRequest = false;
  if (request.requestedProtocols.includes('website')) {
    websiteRequest = true;
  }

  let controllerRequest = false;
  if (request.requestedProtocols.includes('controller')) {
    controllerRequest = true;
  }

  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log(
      new Date() + ' Connection from origin ' + request.origin + ' rejected.'
    );
    return;
  }

  let uid = request.requestedProtocols[2];
  var connection = request.accept('echo-protocol', request.origin);

  request.socket.isAlive = true;

  connections.push(connection);

  const interval = setInterval(() => {
    connections.forEach((connection) => {
      if (connection.isAlive === false) {
        return connection.socket.end();
      }

      connection.isAlive = false;
      connection.send('ping');
    });
  }, 100000);

  if (controllerRequest) {
    controllerConnections[uid] = connection;
  } else if (websiteRequest) {
    websiteConnections[uid] = connection;
  }

  console.log(new Date() + ' Connection accepted.');
  connection.on('message', function (message) {
    if (message.utf8Data.includes('pong')) {
      let connectionUID = message.utf8Data.substring(5);

      if (websiteRequest) {
        websiteConnections[connectionUID].isAlive = true;
      } else {
        controllerConnections[uid].isAlive = true;
      }

      return;
    }

    if (websiteRequest) {
      keyInputs.push(message);
      if (controllerConnections[uid] != null) {
        controllerConnections[uid].send(message.utf8Data);
      } else {
        websiteConnections[uid].send(
          'Error: Controller Application Not Started'
        );
      }
    }
  });
  connection.on('close', function (reasonCode, description) {
    console.log(
      new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
    );
  });
});
