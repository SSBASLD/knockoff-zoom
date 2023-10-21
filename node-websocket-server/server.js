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

//Keep track of all connections to the server
let connections = [];

//Add an event listener when the http server recieves a request
wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log(new Date() + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    //First set this boolean to true
    //This is part of a ping-pong heartbeat method that makes sure a websocket connection doesn't time out
    request.socket.isAlive = true;
    
    //Accepting the request returns the socket connection
    var connection = request.accept('echo-protocol', request.origin);
    //Add the connections
    connections.push(connection);

    //The heartbeat. This pings each socket that is connected to the server. They should respond back, and so the server knows its alive and will keep it alive
    const interval = setInterval(() => {
        connections.forEach((connection) => {
        if (connection.isAlive === false) {
            return connection.socket.end();
        }

        connection.isAlive = false;
        connection.send('ping');
        });
    }, 100000);

    console.log(new Date() + ' Connection accepted.');
    //Handles the messages that the clients send to the server
    connection.on('message', function (message) {
        //If the connection has sent back "pong" then make sure it stays alive
        if (message.utf8Data.includes('pong')) {
            let connectionUID = message.utf8Data.substring(5);
            connection.socket.isAlive = true;

            return;
        }
    });

    //Handle closing of the server
    connection.on('close', function (reasonCode, description) {
        console.log(
            new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
        );
    });
});
