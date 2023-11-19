const textArea = document.getElementById("chatInput");
const arrowButton = document.getElementById("Arrow Button");

const chatWindow = document.getElementById("Chat Window");
const inputChatWindow = document.getElementById("Input Chat Window");

let diff = 9;
let topPercentage = 2;

let oneLine = document.getElementById("oneLineHeight");
let twoLine = document.getElementById("twoLineHeight")

let oneLineHeight = oneLine.scrollHeight;
let twoLineHeight = twoLine.scrollHeight;
let lineDiff = twoLineHeight - oneLineHeight;

const loadingImage = document.getElementById("Loading Image");

chatWindow.style.opacity = "0.5";

let degree = 0;
let rotateAnimation;

function disable() {
    loadingImage.style.display = "block";
    rotateAnimation = setInterval(() => {
        let rotate = `rotate(${degree + 3}deg)`;
        degree += 3;
        loadingImage.style.transform = rotate;
    }, 10);

    chatWindow.style.opacity = "0.5";
    inputChatWindow.style.opacity = "0.5";
    textArea.setAttribute('readonly', true);
    arrowButton.active = false;
}

function enable() {
    loadingImage.style.display = "none";
    clearInterval(rotateAnimation);

    chatWindow.style.opacity = "1";
    inputChatWindow.style.opacity = "1";
    textArea.removeAttribute('readonly');
    arrowButton.active = true;
}

disable();

window.addEventListener('resize', (event) => {
    oneLineHeight = oneLine.scrollHeight;
    twoLineHeight = twoLine.scrollHeight;

    lineDiff = twoLineHeight - oneLineHeight;
    lineDiff = lineDiff == 0 ? 1 : lineDiff;
});

arrowButton.onmouseover = () => {
    arrowUI("over");
}

arrowButton.onmouseleave = () => {
    arrowUI("leave");
}

arrowButton.onmousedown = () => {
    arrowUI("down");
}

arrowButton.onmouseup = () => {
    arrowUI("up");
}

function arrowUI(event) {
    if (!arrowButton.active) return;

    let path = "../../images/"
    switch (event) {
        case "over":
            path += "arrowHover.png";
            break;
        case "leave":
            path += "arrow.png"
            break;
        case "down":
            path += "arrowPress.png";
            break;
        case "up":
            path += "arrowHover.png"
            break;
        default:
            path += "arrow.png"
    }
    arrowButton.src = path;
}

var person = 2;
arrowButton.onclick = () => {
    if (!arrowButton.active) return;
    handleMessage();
}

function createTextArea(value, side) {
    let numOfLines;
    if (side == "left") {
        let bluePerson = document.createElement("img");
        bluePerson.className = "person";
        bluePerson.src = "../../images/BluePerson.png"
        bluePerson.style.left = "7%";
        bluePerson.style.top = `${topPercentage}%`;
        chatWindow.appendChild(bluePerson);
    
        let leftTextArea = document.createElement("div");
        leftTextArea.className = "leftTextArea";
    
        leftTextArea.innerHTML += value;
        leftTextArea.style.top = `${topPercentage}%`;
    
        chatWindow.appendChild(leftTextArea);
    
        let heightLineDivision = Math.floor((leftTextArea.scrollHeight - oneLineHeight) / lineDiff);
        numOfLines = heightLineDivision + 1;
    } else if (side == "right") {
        let greenPerson = document.createElement("img");
        greenPerson.className = "person";
        greenPerson.src = "../../images/GreenPerson.png"
        greenPerson.style.left = "92%";
        greenPerson.style.top = `${topPercentage}%`;
        chatWindow.appendChild(greenPerson);
    
        let rightTextArea = document.createElement("div");
        rightTextArea.className = "rightTextArea";
    
        rightTextArea.innerHTML += value;
        rightTextArea.style.top = `${topPercentage}%`;
    
        chatWindow.appendChild(rightTextArea);
    
        let heightLineDivision = Math.floor((rightTextArea.scrollHeight - oneLineHeight) / lineDiff);
        numOfLines = heightLineDivision + 1;
    }
    
    topPercentage += diff + 3*((numOfLines - 2) < 0 ? 0 : numOfLines - 2);

    chatWindow.scrollTop = chatWindow.scrollHeight - chatWindow.clientHeight;
}

textArea.addEventListener("keypress", (e) => {
    if (!arrowButton.active) return;

    if (e.key == "Enter") {
        handleMessage();
    }
});

function handleMessage() {
    if (!client.connected) {
        alert("Not connected to the server");
        return;
    }

    let value = textArea.value;
    textArea.value = "";

    value = value.trim();
    if (value == "") {
        return;
    }

    let jsonText = `{"message": "${value}", "roomKey": "${roomKey}"}`;

    client.send(jsonText);

    let oneLineBreak = document.createElement("br");
    let twoLineBreak = document.createElement("br");
    if (person != null) {
        if (person == 1) {
            createTextArea(value, "left");
        } else {
            createTextArea(value, "right");
        }
    }
}

let roomKey;
let client;
let autoReconnectDelay = 5000;
async function setUpSocket() {
    roomKey = await sessionStorage.getItem('Room Key');


    client = new WebSocket("wss://node-websocket-server-a4uv.onrender.com/ws/", ['echo-protocol', roomKey]);
    client.onopen = () => {
        enable();
        client.connected = true;
        console.log("Connection Established");
    }

    client.onclose = function(e) {
        disable();
        console.log('echo-protocol Client Closed');
        console.log(e.reason);

        setTimeout(() => {
            setUpSocket();
        }, autoReconnectDelay)
    };

    client.onmessage = (message) => {
        try {
            var jsonData = JSON.parse(message.data);
        } catch (e) {
            if (message.data == "ping") { 
                return;
            }

            console.log("Message data was not sent in JSON format");
            console.error(e);
            return;
        } finally {
            client.send('pong');
        }

        if (jsonData.type == "Error") {
            alert(jsonData.message);
            return;
        } else if (jsonData.type == "Message") {
            if (jsonData.person == 1) {
                createTextArea(jsonData.message, "left");
            } else {
                createTextArea(jsonData.message, "right");
            }
        } else if (jsonData.type == "Info") {
            person = jsonData.person;

            for (let message of jsonData.message) {
                if (message.person == 1) {
                    createTextArea(message.message, "left");
                } else {
                    createTextArea(message.message, "right");
                }
            }
        }
    };
}

setUpSocket();