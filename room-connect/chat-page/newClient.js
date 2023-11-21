class Message{ // Defines message class used over websockets
    constructor(head, content) {
        this.head = head;
        this.content = content;
    }
} 
const _constraints = { // Sets a standardize constraint for video and audio
    "video": {
        "width": 500,
        "height": 500
    },
    "audio": true,
    'mandatory': {
        'offertoreceiveaudio': true,
        'offertoreceivevideo': true
    }
};

const _iceServers = {'iceServers': [{'urls': 'stun:stun3.l.google.com:19302'}]}; // sets up which stun server to use.
const socket = new WebSocket('wss://node-webrtc-server.onrender.com/ws/', ['echo-protocol']); // Connects to the websocket server
var localVideo;
var remoteVideo;
var localStream;
var peerConnection;

// The code above defines all the variables needed


async function start() { // This runs once the document load
    localVideo = document.getElementById("localVideo"); // gets document element
    remoteVideo = document.getElementById("remoteVideo");
    localStream = await navigator.mediaDevices.getUserMedia(_constraints); //Get video and audxio tracks from user
    console.log(localStream);
    localVideo.srcObject = localStream; // Makes your video viewable to you
}

socket.onopen = () => {
    console.log("connection established");
    socket.onmessage = (event) => {
        try {
            var message = JSON.parse(event.data); // When a message is recieved, program will attempt to turn it into JSON
            if (!peerConnection && message.head != "Ping") startUp(false); // Starts up the webrtc process when another user calls
            switch (message.head) {
                case "incommingCall": // The switch statements is used to handle certain requests sent over.
                    console.log("Recieved New Incomming Call");
                    acceptCall(message.content);
                    break;
                case "incommingICE":
                    console.log("Recieved New ICE Candidate");
                    handleNewIceCandidate(message.content);
                    break;
                case "incommingAccept":
                    console.log("Recieved New Accept Offer");
                    handleAccept(message.content);
                    break;
                default: //By default, if message.head does not match, it will automatically assume it was a ping
                socket.send(JSON.stringify(new Message("Ping", "Ping")));
            }
        } catch (error) { 
            console.log(error);
        }
    };
    socket.onclose = (event) => { // when websocket closes, prints out the reason why.
        console.log(event);
    }
};


async function startUp(isCaller) { // Starts up when a user presses the start call button
    peerConnection = new RTCPeerConnection(_iceServers); // creates new RTCPeerConnection object and uses ice server provided
    peerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate) sendIceCandidate(event.candidate); 
    })
    localStream.getTracks().forEach(track => { // Whenever the PC obejct is created, add local video to send over
        peerConnection.addTrack(track, localStream);
    });
    peerConnection.addEventListener("track", async (event) => { // ran whenever recieve new video from other socket
        let [remoteStream] = event.streams; 
        remoteVideo.srcObject = remoteStream;// Displays the video
        
    });

    if (isCaller == true) { // checks if socket is the caller
        console.log("Attempting to start call");
        let offer = await peerConnection.createOffer(); // creates a call offer
        await peerConnection.setLocalDescription(offer); // sets the offer as local description
        socket.send(JSON.stringify(new Message("callRequest", offer))); // send the offer to the other socket via websocket
    }
}

async function acceptCall(offer) { // called when websocket indicate that the socket is recieving a call
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))  // sets the offer sent over as remote description
    let answer = await peerConnection.createAnswer(); // creates a answer offer
    await peerConnection.setLocalDescription(answer); // sets it as local description
    socket.send(JSON.stringify(new Message("acceptRequest", answer))); // sends the answer offer over
    console.log(peerConnection.setLocalDescription);
}

async function sendIceCandidate(iceCandidate){ // whenever an ice candidate is recieved
    socket.send(JSON.stringify(new Message("iceCandidate", iceCandidate))); // sends the ice candidate to other socket
}
async function handleNewIceCandidate(iceCandidate) {
    await peerConnection.addIceCandidate(iceCandidate); // adds ice candidate whenever recieved from other socket
}
async function handleAccept(acceptOffer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(acceptOffer)); //  sets the accept request as remote description
    console.log("Accepted call");
}