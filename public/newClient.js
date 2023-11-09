class Message{
    constructor(head, content) {
        this.head = head;
        this.content = content;
    }
} 
const _constraints = {
    "video": {
        "width": 500,
        "height": 500
    },
    "audio": true
};

const _iceServers = {'iceServers': [{'urls': 'stun:stun3.l.google.com:19302'}]}; // sets up which stun server to use.
const client = new WebSocket('ws://localhost:8080', ['echo-protocol']);
var localVideo;
var remoteVideo;
var localStream;
var peerConnection;


async function start() {
    localVideo = document.getElementById("localVideo");
    remoteVideo = document.getElementById("remoteVideo");
    localStream = await navigator.mediaDevices.getUserMedia(_constraints);
    localVideo.srcObject = localStream;
}

client.onopen = () => {
    client.onmessage = (event) => {
        try {
            if (!peerConnection) startUp(false); 
            var message = JSON.parse(event);
            switch (message.head) {
                case "incommingCall":
                    acceptCall(messgae.content)
                    break;
                case "incommingICE":
                    handleNewIceCandidate(message.content)
                    break;
                case "incommingAccept":
                    handleAccept(message.content);
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    };
};




async function startUp(isCaller) {
    peerConnection = new RTCPeerConnection(_iceServers);
    peerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate) sendIceCandidate(event.candidate);
    })
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    peerConnection.addEventListener("track", async (event) => {
        const [remoteStream] = event.streams;
        remoteVideo.srcObject = remoteStream;
    });

    if (isCaller == true) {
        let offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        client.send(JSON.stringify(new Message("callRequest")));
    }
}

async function acceptCall(offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    client.send(JSON.stringify(new Message("acceptRequest", answer)));

}

async function sendIceCandidate(iceCandidate){
    client.send(JSON.stringify(new Message("iceCandidate", iceCandidate)))
}
async function handleNewIceCandidate(iceCandidate) {
    await peerConnection.addIceCandidate(iceCandidate);
}
async function handleAccept(acceptOffer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(acceptOffer));
}