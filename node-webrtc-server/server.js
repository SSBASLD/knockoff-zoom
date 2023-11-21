// Establish new message class for Websockets
class Message{
    constructor(head, content) {
        this.head = head;
        this.content = content;
    }
}   
//Import the required dependencies
var WebSocketServer = require('websocket').server;

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
    
    var connection = request.accept('echo-protocol', request.origin); // Accepts request
    var uid = Math.random().toString(16); // Generates random ID
    connection.uid = uid;
    connections.set(connection, uid); //Add the connections and ties to custom ID

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
                    handleCallRequests(connection.uid, message.content);
                    break;
                case "acceptRequest":
                    console.log("Handling Accept Request");
                    handleAcceptRequests(connection.uid, message.content);
                    break;
                case "iceCandidate":
                    console.log("Handling new ICE candidate");
                    handleIceCandidate(connection.uid, message.content);
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

function handleCallRequests(uid, callOffer) {  // sends call offer to other client
    connections.forEach((value, connection) => {
        if (value != uid) {
            console.log(`caller: ${uid}, reciever: ${value}`);
            connection.send(JSON.stringify(new Message("incommingCall", callOffer)));
        }
    })
}

function handleAcceptRequests(uid, acceptOffer) { // sends accept offer to other client
    connections.forEach((value, connection) => {
        if (value != uid) {
            connection.send(JSON.stringify(new Message("incommingAccept", acceptOffer)));
        }
    })
}
function handleIceCandidate(uid, iceCandidate) { // sends ice candidate to other client
    connections.forEach((value, connection) => {
        if (value != uid) {
            connection.send(JSON.stringify(new Message("incommingICE", iceCandidate)));
        }
    })
}