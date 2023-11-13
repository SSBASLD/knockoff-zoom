// Establish new message class for Websockets
class Message{
    constructor(head, content) {
        this.head = head;
        this.content = content;
    }
}   
//Import the required dependencies
const express = require("express")
const app = express();
var WebSocketServer = require('websocket').server;
var http = require('http');

//Create a http server with a simple request listener
  //A http server is simply a computer program that uses the response/request model implemented by the World Wide Web and the HTTP
var server = http.Server(app,function (request, response) {
    console.log("hi");

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
let connections = new Map();

//Add an event listener when the http server recieves a request
wsServer.on('request', function (request) {
    console.log("hi");

    if (!originIsAllowed(request.origin)) {  // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log(new Date() + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    //First set this boolean to true
    //This is part of a ping-pong heartbeat method that makes sure a websocket connection doesn't time out
    request.socket.isAlive = true;
    
    var connection = request.accept('echo-protocol', request.origin); // Accepts request
    var uid = Math.random().toString(16); // Generates random ID
    connections.set(connection, uid); //Add the connections and ties to custom ID

    //The heartbeat. This pings each socket that is connected to the server. They should respond back, and so the server knows its alive and will keep it alive
    const interval = setInterval(heartbeat, 100000);

    console.log(new Date() + ' Connection accepted.'); // Logs connection

    connection.on('message', (event) => { // Handles messages sent to WS
        try {
            var message = JSON.parse(event.utf8Data)
            switch (message.head) {
                case "callRequest":
                    console.log("Handling New Call Request");
                    handleCallRequests(connection.socket.uid, message.content);
                    break;
                case "acceptRequest":
                    console.log("Handling Accept Request");
                    handleAcceptRequests(connection.socket.uid, message.content);
                    break;
                case "iceCandidate":
                    console.log("Handling new ICE candidate");
                    handleIceCandidate(connection.socket.uid, message.content);
                    break;
            }
        } catch (error) {
            console.log(error)  
        } finally {
            connection.isAlive = true;
        }

    });

    //Handle closing of the server
    connection.on('close', function (reasonCode, description) {
        console.log(
            new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
        );
    });
});

function heartbeat() {
    connections.forEach((value, connection, map) => {
        if (connection.isAlive === false) {
            console.log("Connection Killed");
            connections.delete(connection);
            return connection.socket.end();
        }

        connection.isAlive = false;
        connection.send(JSON.stringify(new Message("Ping", "Ping")));
    })
}

function handleCallRequests(uid, callOffer) {
    connections.forEach((value, connection) => {
        if (connection.uid != uid) {
            connection.send(JSON.stringify(new Message("incommingCall", callOffer)));
        }
    })
}

function handleAcceptRequests(uid, acceptOffer) {
    connections.forEach((value, connection) => {
        if (connection.uid != uid) {
            connection.send(JSON.stringify(new Message("incommingAccept", acceptOffer)));
        }
    })
}
function handleIceCandidate(uid, iceCandidate) {
    connections.forEach((value, connection) => {
        if (connection.uid != uid) {
            connection.send(JSON.stringify(new Message("incommingICE", iceCandidate)));
        }
    })
}