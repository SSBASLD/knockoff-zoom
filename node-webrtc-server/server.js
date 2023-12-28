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
    let roomKey = request.requestedProtocols[1];
    console.log(roomKey);
    var connection = request.accept('echo-protocol', request.origin); // Accepts request
    var uid = Math.random().toString(16); // Generates random ID
    connection.uid = uid;
    connection.roomKey = roomKey;
    connections.set(connection, roomKey); //Add the connections and ties to custom ID

    //The heartbeat. This pings each socket that is connected to the server. They should respond back, and so the server knows its alive and will keep it alive
    const interval = setInterval(heartbeat, 100000);

    console.log(new Date() + ' Connection accepted.'); // Logs connection

    connection.on('message', (event) => { // Handles messages sent to WS
        console.log(connection.uid);
        try {
            var message = JSON.parse(event.utf8Data) // try to parse the data sent from client
            switch (message.head) { // Handles requests sent from clients
                case "callRequest":
                    console.log("Handling New Call Request");
                    handleCallRequests(connection.uid, message.content, connection.roomKey,connection);
                    break;
                case "acceptRequest":
                    console.log("Handling Accept Request");
                    handleAcceptRequests(connection.uid, message.content, connection.roomKey);
                    break;
                case "iceCandidate":
                    console.log("Handling new ICE candidate");
                    handleIceCandidate(connection.uid, message.content, connection.roomKey);
                    break;
                default:
                    console.log(message.head);
            }
        } catch (error) {
            console.log(error);  
        } finally {
            console.log("Connection Is Still Alive");
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

function heartbeat() { // Pings the client ever so often to check if the connection is still alive
    connections.forEach((value, connection, map) => {
        if (connection.isAlive === false) {
            console.log("Connection Killed");
            connections.delete(connection);
            return connection.socket.end();
        }

        console.log("Attempting To Ping");
        connection.isAlive = false;
        connection.send(JSON.stringify(new Message("Ping", "Ping")));
    })
}

function handleCallRequests(uid, callOffer, givenRoomKey, connection) {  // sends call offer to other client
    let otherInRoom = false;
    connections.forEach((roomKey, connection) => {
        if (roomKey == givenRoomKey && connection.uid != uid) {
            console.log(`caller: ${uid}, reciever: ${roomKey}`);
            connection.send(JSON.stringify(new Message("incommingCall", callOffer)));
            otherInRoom = true;
        }
    });
    if (otherInRoom == false) {
        console.log("the room is empty");
        connection.send(JSON.stringify(new Message("emptyRoom", "emptyRoom")));        
    }
}

function handleAcceptRequests(uid, acceptOffer, givenRoomKey) { // sends accept offer to other client
    connections.forEach((roomKey, connection) => {
        if (roomKey == givenRoomKey && connection.uid != uid) {
            connection.send(JSON.stringify(new Message("incommingAccept", acceptOffer)));
        }
    })
}
function handleIceCandidate(uid, iceCandidate, givenRoomKey) { // sends ice candidate to other client
    connections.forEach((roomKey, connection) => {
        if (roomKey == givenRoomKey && connection.uid != uid) {
            connection.send(JSON.stringify(new Message("incommingICE", iceCandidate)));
        }
    })
}