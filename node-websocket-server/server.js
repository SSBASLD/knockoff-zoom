//Import the required dependencies
const express = require("express")
var WebSocketServer = require('websocket').server;
var http = require('http');

//Create an express instance
const app = express();

//Create a http server with a simple request listener
  //A http server is simply a computer program that uses the response/request model implemented by the World Wide Web and the HTTP
var server = http.createServer(app, function (request, response) {
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
let roomConnections = {};
let connections = new Map();

//The heartbeat. This pings each socket that is connected to the server. They should respond back, and so the server knows its alive and will keep it alive
const interval = setInterval(() => {
    connections.forEach((value, connection, map) => {
        if (connection.isAlive === false) {
            console.log("connection killed");
            connections.delete(connection);
            return connection.socket.end();
        }
    
        connection.isAlive = false;
        connection.send("ping");
    })
}, 10000);

//Add an event listener when the http server recieves a request
wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log(new Date() + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    let roomKey = request.requestedProtocols[1];
    
    //Accepting the request returns the socket connection
    var connection = request.accept('echo-protocol', request.origin);
    //Add the connections
    connections.set(connection, true);

    //First set this boolean to true
    //This is part of a ping-pong heartbeat method that makes sure a websocket connection doesn't time out
    connection.isAlive = true;

    if (roomConnections[roomKey] == null) {
        roomConnections[roomKey] = [];
        roomConnections[roomKey].push(connection);
    } else roomConnections[roomKey].push(connection);

    let personIndex = roomConnections[roomKey].indexOf(connection) + 1;
    let jsonString= `{"type": "Info", "message": "", "person": "${personIndex}"}`;

    connection.send(jsonString);

    console.log(new Date() + ' Connection accepted.');
    //Handles the messages that the clients send to the server
    connection.on('message', function (message) {
        try {
            var jsonData = JSON.parse(message.utf8Data);
        } catch (e) {
            if (message.utf8Data == "pong") return;
            console.log("Message data was not in JSON format");
            console.error(e);
            return;
        } finally {
            console.log("still alive");
            connection.isAlive = true;
        }

        let otherConnection = roomConnections[jsonData.roomKey].filter((socket) => connection != socket);

        let sentMessage;
        let type;
        if (otherConnection.length == 0) {
            type = "Error"
            sentMessage = "Error: Nobody else in room";
            let jsonString = `{"type": "${type}", "message": "${sentMessage}", "person": ""}`;
            connection.send(jsonString);
            return;
        } else {
            type = "Message"
            sentMessage = jsonData.message;
        }

        let personIndex = roomConnections[jsonData.roomKey].indexOf(connection) + 1;
        let jsonString= `{"type": "${type}", "message": "${sentMessage}", "person": "${personIndex}"}`;

        otherConnection[0].send(jsonString);
    });

    //Handle closing of the server
    connection.on('close', function (reasonCode, description) {
        connections.delete(connection);

        let connectionIndex = roomConnections[roomKey].indexOf(connection);
        roomConnections[roomKey].splice(connectionIndex, 1);

        console.log(reasonCode + " " + description);

        console.log(
            new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
        );
    });
});
