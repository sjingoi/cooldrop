//CONNECTION TYPE
typeSelection = document.getElementById("connection-type")
submitTypeBtn = document.getElementById("submit-type")
submitTypeBtn.onclick = submitType

//LOCAL
submitLocalBtn = document.getElementById("submit-local")
localOfferBox = document.getElementById("local-offer")

//REMOTE
submitRemoteBtn = document.getElementById("submit-remote")
remoteOfferBox = document.getElementById("remote-offer")

//TEXTBOX
submitTextBtn = document.getElementById("submit-text")
sendBox = document.getElementById("chat-box-send")
recieveBox = document.getElementById("chat-box-recieve")
connectionMsg = document.getElementById("connection-open-msg")

//FILE TRANSFER
fileInput = document.getElementById("fileInput");
fileUploadBtn = document.getElementById("send-file")

var chunkcount = 0;
var chunks = [];

const SERVERS = {
    iceServers:[
        {
            urls:["stun:stun1.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ]
}

function submitType() {
    /**
     * Usually executed when the type selector button is pressed.
     */
    submitTypeBtn.disabled = true
    typeSelection.disabled = true
    remoteOfferBox.disabled = false

    if (typeSelection.value == "local") {
        createLocalConnection()
    } else {
        submitRemoteBtn.disabled = false
        submitRemoteBtn.onclick = createRemoteConnection
    }
}

function createLocalConnection() {
    const lc = new RTCPeerConnection(SERVERS);
    const dc = lc.createDataChannel("channel")

    localOfferBox.disabled = false

    dc.onmessage = message => {
        dataHandler(message);
    }
    dc.onopen = e => {
        console.log("Connection opened.")
        startChatBox(dc);
        startFileBox(dc);
    };
    lc.onicecandidate = e => {
        console.log("Created new ICE candidate.")
        localOfferBox.textContent = JSON.stringify(lc.localDescription)/*.replace("UDP", "TCP").replace("udp","tcp")*/;
    }
    lc.createOffer().then(offer => lc.setLocalDescription(offer)).then(a => console.log("Local description set successfully."))
    submitRemoteBtn.disabled = false
    submitRemoteBtn.onclick = () => {
        submitRemoteBtn.disabled = true
        const answer = JSON.parse(remoteOfferBox.value)
        lc.setRemoteDescription(answer)
    }
}

function createRemoteConnection() {
    submitRemoteBtn.disabled = true
    localOfferBox.disabled = false

    const offer = JSON.parse(remoteOfferBox.value)
    const rc = new RTCPeerConnection(SERVERS)
    rc.onicecandidate = e => {
        console.log("Created new ICE candidate.")
        localOfferBox.textContent = JSON.stringify(rc.localDescription)
    }
    rc.ondatachannel = dataChannel => {
        rc.dc = dataChannel.channel
        rc.dc.onmessage = message => {
            dataHandler(message);
        }
        rc.dc.onopen = e => console.log("Connection opened.")
        startChatBox(rc.dc);
        startFileBox(rc.dc);
    }
    rc.setRemoteDescription(offer).then(a => console.log("Offer set."));
    rc.createAnswer().then(answer => rc.setLocalDescription(answer)).then(a => console.log("Answer created."))
    
}

function dataHandler(message) {
    console.log("Type of data: " + typeof(message.data));
    if (typeof(message.data) == "string") {
        if (message.data.startsWith("%/chunkcount")) {
            chunks = [];
            chunkcount = parseInt(message.data.replace("%/chunkcount", ""));
            console.log("Hello123 " + chunkcount)
        }
        console.log("Hello");
        recieveBox.textContent = message.data
        console.log("Hello123 " + chunkcount)
    } else if (typeof(message.data) == "object") {
        console.log(chunks.length);
        //console.log(chunkcount);
        const chunk = message.data;
        chunks.push(chunk);
        if (chunks.length == chunkcount) {
            console.log("Hello2");
            fileData = new Blob(chunks, { type: 'application/octet-stream' });
            downloadBlobAsFile(fileData, "test")
        }
    }
}

function startChatBox(dataChannel) {
    sendBox.disabled = false
    localOfferBox.disabled = true
    remoteOfferBox.disabled = true
    connectionMsg.textContent = "Connection Opened. You can now send messages."

    submitTextBtn.onclick = () => {
        dataChannel.send(sendBox.value)
        sendBox.value = "";
    }
}

function startFileBox(dataChannel) {
    fileUploadBtn.onclick = () => {
        const file = fileInput.files[0];
        const chunkSize = 256 * 1024;
        const numChunks = Math.ceil(file.size / chunkSize);
        let offset = 0;
        dataChannel.send("%/chunkcount" + numChunks);
        for (let i = 0; i < numChunks; i++) {
            const chunk = file.slice(offset, offset + chunkSize);
            const reader = new FileReader();
            reader.onload = function(event) {
                dataChannel.send(event.target.result);
            }
            reader.readAsArrayBuffer(chunk);
            offset += chunkSize;
        }
    }
}

function uploadFile() {
    const file = fileInput.files[0];

    
  
    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      // Do something with the file contents...
      console.log(contents);
    };
    reader.readAsArrayBuffer(file);
}

function downloadBlobAsFile(blob) {
    // Get the filename from the Blob object
    const filename = blob.name;
  
    // Create a new download link element
    const downloadLink = document.createElement('a');
  
    // Set the download link attributes
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
  
    // Simulate a click on the download link
    downloadLink.click();
  
    // Clean up the URL object
    URL.revokeObjectURL(downloadLink.href);
  }
  