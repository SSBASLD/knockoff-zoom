/*
    This project uses the following packages and referenced these sources.
    https://webRTC.org - Webrtc for video connection
    https://www.npmjs.com/package/express - ExpressJS for HTTP servers
    https://www.npmjs.com/package/websocket - websocket package for WebSockets
    https://www.npmjs.com/package/nodemon - Nodemon for hosting local servers during development
*/

//Data structure to represent individual chat rooms
class VideoRoom {
    constructor() {
        //Easy data structure to manage clients in a room
        //Important info the server needs to know: order connected (person number), and connection
        this.connections = new Map();

        //Previous messages sent in the room
        //An array is useful as we can store them when they are sent, thus keeping the order
        this.messageLog = [];
    }

    //This simply handles adding a connection
    //The max number of people in a room is 2, so the person number can only be 1 or 2
    addConnection(connection) {
        if (this.connections.size == 0) {
            this.connections.set(connection, 1);
            return 1;
        } else {
            let indices = this.connections.values().next().value;
            let otherIndex = (indices == 2) ? 1 : 2;
    
            this.connections.set(connection, otherIndex);
            return otherIndex;
        }
    }

    //A simple method to get a connection based on its person number
    getConnectionByIndex(index) {
        for (let [key, value] of this.connections.entries()) {
            if (value === index) return key;
        }
    }

    //Converts the message log array into a JSON string array
    logToString() {
        let string = "";
        for (const message of this.messageLog) {
            string += `${message}`;
            string += ",";
        }
        string = string.slice(0, string.length - 1);
        string = "[" + string + "]";
        
        return string;
    }
}

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

    //Gets the room key from the additional data provided in the websocket connection request
    let roomKey = request.requestedProtocols[1];
    
    //Accepting the request returns the socket connection
    var connection = request.accept('echo-protocol', request.origin);
    //Add the connections
    connections.set(connection, true);

    //First set this boolean to true
    //This is part of a ping-pong heartbeat method that makes sure a websocket connection doesn't time out
    connection.isAlive = true;

    //If a video room hasn't already been intialized, create one
    if (roomConnections[roomKey] == null) {
        roomConnections[roomKey] = new VideoRoom();
    }

    //Find out the person number of the connection
    let personIndex = roomConnections[roomKey].addConnection(connection);
    let messageLog = roomConnections[roomKey].logToString();

    //Send the connection its person number as well as any previous messages in the room
    let jsonString= `{"type": "Info", "message": ${messageLog}, "person": "${personIndex}"}`;
    connection.send(jsonString);

    console.log(new Date() + ' Connection accepted.');
    //Handles the messages that the clients send to the server
    connection.on('message', function (message) {
        try {
            var jsonData = JSON.parse(message.utf8Data);
        } catch (e) {
            //We know that this case isn't an error, so we ignore it
            if (message.utf8Data == "pong") return;

            console.log("Message data was not in JSON format");
            console.error(e);
            return;
        } finally {
            //If the connection is responding back, then always set it to alive, no matter the message
            connection.isAlive = true;
        }

        //Finds the other connection in the video room
        let otherIndex = personIndex == 2 ? 1 : 2;
        let otherConnection = roomConnections[jsonData.roomKey].getConnectionByIndex(otherIndex);

        //If there are no other connections in the video room, send back an error
        if (otherConnection == null) {
            let jsonString = `{"type": "Error", "message": "Error: Nobody else in room", "person": ""}`;
            connection.send(jsonString);
            return;
        }

        //Send the message along with who sent it (personIndex)
        let jsonString = `{"type": "Message", "message": "${jsonData.message}", "person": "${personIndex}"}`;
        roomConnections[jsonData.roomKey].messageLog.push(jsonString);
        otherConnection.send(jsonString);
    });

    //Handle closing of the server
    connection.on('close', function (reasonCode, description) {
        //Delete the connection that closed from its video room as well as the general connections map
        connections.delete(connection);
        roomConnections[roomKey].connections.delete(connection);

        //Delete the video room if its empty
        if (roomConnections[roomKey].connections.size == 0) {
            roomConnections[roomKey] = null;
        }

        console.log(reasonCode + " " + description);
        console.log(
            new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
        );
    });
});