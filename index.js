class Message{
    constructor(head, content) {
        this.head = head;
        this.content = content;
    }
}   


const _iceServers = {'iceServers': [{'urls': 'stun:stun3.l.google.com:19302'}]} // sets up which stun server to use.
var connection;

let client = new WebSocket('ws://localhost:8080', ['echo-protocol']);
client.onopen = () => {
    client.onmessage = function (event) {
        try {
            var message = JSON.parse(event.utf8Data);
            switch (message.head) {
                case "acceptRecieved":
                    handleAccept(message.content);
                    break;
                case "callRecieved":
                    acceptCall(message.content);
                    break;
                case "iceCandidate":
                    handleIceCandidate(message.content);
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    }
}


async function makeCall() {
    const pc = new RTCPeerConnection(_iceServersiceServers); // Creates a new RTCPeerConnection instance with ICE candidates recieved from stun server
    connection = pc;
    const offer = await pc.createOffer(); // Await bc it returns a promise
    await pc.setLocalDescription(offer); // Await bc it returns a promise
    client.send(JSON.stringify(new Message("callRequest", offer)));
    pc.addEventListener("icecandidate", event => {
        if (event.candidate) {
            client.send(new Message("iceCandidate", event.candidate));
        }
    });
}

async function acceptCall(offer) {
    const pc = new RTCPeerConnection(_iceServers)
    connection = pc;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    client.send(JSON.stringify(new Message("acceptRequest", answer)));
    pc.addEventListener("icecandidate", event => {
        client.send(new Message("iceCandidate", event.candidate));
    });
}
async function handleAccept(acceptOffer) {
    await connection.setRemoteDescription(new RTCSessionDescription(acceptOffer));
}
async function handleIceCandidate(candidate) {
    await connection.addIceCandidate(candidate);
}