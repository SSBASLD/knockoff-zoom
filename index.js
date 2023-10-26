class Message{
    constructor(head, content) {
        this.head = head;
        this.content = content;
    }
}   


const _iceServers = {'iceServers': [{'urls': 'stun:stun3.l.google.com:19302'}]} // sets up which stun server to use.
var connections = [] 

let client = new WebSocket('ws://localhost:8080', ['echo-protocol']);
client.onopen = () => {

    client.onmessage = function (event) {
        try {
            var message = JSON.parse(event.utf8Data);
            switch (message.head) {
                case "value":
                    
                    break;
            
                default:
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    }
}


async function makeCall() {
    const pc = new RTCPeerConnection(_iceServersiceServers); // Creates a new RTCPeerConnection instance with ICE candidates recieved from stun server
    const offer = await pc.createOffer(); // Await bc it returns a promise
    await pc.setLocalDescription(offer); // Await bc it returns a promise
    client.send(new Message("callRequest", offer))
}

async function acceptCall(offer) {
    const pc = new RTCPeerConnection(_iceServers)
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    client.send(new Message("acceptRequest", answer));
}
async function handleAccept(acceptOffer) {
    await pc.setRemoteDescription(new RTCSessionDescription(acceptOffer));
}