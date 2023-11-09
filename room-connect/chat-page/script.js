let chatSquare = document.getElementById("Chat Square");
chatSquare.style.display = "none";

let textArea = document.getElementById("chatInput");
let arrowButton = document.getElementById("Arrow Button");

let chatWindow = document.getElementById("Chat Window");

let diff = 9;
let topPercentage = 2;

let oneLineHeight = document.getElementById("oneLineHeight").scrollHeight;
let twoLineHeight = document.getElementById("twoLineHeight").scrollHeight;
let lineDiff = twoLineHeight - oneLineHeight;

var person = 2;
arrowButton.onclick = () => {

    let value = textArea.value;
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
}

let roomKey;
let client;
async function setUpSocket() {
    roomKey = await sessionStorage.getItem('Room Key');
    console.log(roomKey);


    client = new WebSocket("wss://node-websocket-server-a4uv.onrender.com/ws/", ['echo-protocol', roomKey]);
    client.onopen = () => {
        console.log("Connection Established");
    }

    client.onmessage = (message) => {
        try {
            var jsonData = JSON.parse(message.data);
        } catch (e) {
            if (message.data == "ping") {
                client.send('pong');
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
            console.log(jsonData.person);

            if (jsonData.person == 1) {
                createTextArea(jsonData.message, "left");
            } else {
                createTextArea(jsonData.message, "right");
            }
        } else if (jsonData.type == "Info") {
            person = jsonData.person;
        }
    };
}

setUpSocket();