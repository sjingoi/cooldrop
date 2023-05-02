// interface FileHeader {
//     type: 'header',
//     filename: string,
//     filetype: string,
//     filesize: number,
//     chunksize: number,
//     lastchunksize: number,
//     chunkcount: number
// }

export interface Package {
    type: string,
    recipient: string,
    sender: string,
    connection_id: string,
    ice_candidate?: RTCIceCandidate,
    sdp?: RTCSessionDescription
}

//var fileHeader: FileHeader;
//var chunks: any[];

const SERVERS = {
    iceServers:[
        {
            urls:["stun:stun1.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ]
}

class PeerConnection {
    private connection: RTCPeerConnection;
    private datachannel?: RTCDataChannel;
    private local_uuid: string;
    private remote_uuid: string;
    private send: any;
    public connection_id: string;
    public on_open = (event: Event) => {}
    public on_close = (event: Event) => {}


    public constructor(connection_id: string, local_uuid: string, remote_uuid: string, send: any, remote_offer?: RTCSessionDescription) {
        this.connection_id = connection_id;
        this.send = send;
        this.local_uuid = local_uuid;
        this.remote_uuid = remote_uuid;
        this.connection = new RTCPeerConnection(SERVERS);
        this.setup_datachannel(remote_offer);
    }

    private setup_datachannel(remote_offer?: RTCSessionDescription) {
        this.connection.onicecandidate = ice_event => this.on_ice(ice_event);
        if (remote_offer === undefined) {
            console.log("Creating Local Connection")

            //LOCAL

            this.datachannel = this.connection.createDataChannel("channel");
            this.connection.createOffer().then(offer => this.connection.setLocalDescription(offer)).then(a => console.log("Set local description."));

            this.datachannel.onmessage = message => this.message_handler(message);
            this.datachannel.onopen = event => this.on_open_connection(event);
            this.datachannel.onclose = event => this.on_close_connection(event);
            
        } else {

            // REMOTE
            console.log("Creating Remote Connection")
            
            this.connection.setRemoteDescription(remote_offer);
            this.connection.ondatachannel = event => {
                this.datachannel = event.channel;
                this.datachannel.onmessage = message => this.message_handler(message);
                this.datachannel.onopen = event => this.on_open_connection(event);
                this.datachannel.onclose = event => this.on_close_connection(event);
            }
            this.connection.createAnswer().then(answer => this.connection.setLocalDescription(answer)).then(a => console.log("Created answer."));
        }
    }

    private message_handler(message: MessageEvent) {

    }

    private on_open_connection(event: Event) {
        console.log("Connection Opened!");
        this.on_open(event);
    }

    private on_close_connection(event: Event) {
        console.log("Connection Closed.");
        this.on_close(event);
    }

    private on_ice(event: RTCPeerConnectionIceEvent) {
        if (event.candidate == null) {
            //console.log(this.connection.localDescription);
            if (this.connection.localDescription !== null) {
                let pkg: Package = {
                    type: "sdp",
                    recipient: this.remote_uuid,
                    sender: this.local_uuid,
                    connection_id: this.connection_id,
                    sdp: this.connection.localDescription
                }
                this.send(pkg);
            } else {
                console.log("Could not send local connection as it is null.");
            }
        }
    }

    public add_ice_candidate(ice_candidate: RTCIceCandidate) {
        this.connection.addIceCandidate(ice_candidate);
    }

    public set_remote(sdp: RTCSessionDescription) {
        this.connection.setRemoteDescription(sdp);
        //console.log("Set remote connection.")
    }

    public get_remote_id() {
        return this.remote_uuid;
    }
}

// function submitType() {
//     /**
//      * Usually executed when the type selector button is pressed.
//      */
//     submitTypeBtn.disabled = true
//     typeSelection.disabled = true
//     remoteOfferBox.disabled = false

//     if (typeSelection.value == "local") {
//         createLocalConnection()
//     } else {
//         submitRemoteBtn.disabled = false
//         submitRemoteBtn.onclick = createRemoteConnection
//     }
// }

// function createLocalConnection() {
//     const lc = new RTCPeerConnection(SERVERS);
//     const dc = lc.createDataChannel("channel")

//     localOfferBox.disabled = false

//     dc.onmessage = message => {
//         dataHandler(message, dc)
//     }
//     dc.onopen = e => {
//         console.log("Connection opened.")
//         startChatBox(dc);
//         startFileBox(dc);
//     };
//     lc.onicecandidate = e => {
//         console.log("Created new ICE candidate.")
//         localOfferBox.textContent = JSON.stringify(lc.localDescription)/*.replace("UDP", "TCP").replace("udp","tcp")*/;
//     }
//     lc.createOffer().then(offer => lc.setLocalDescription(offer)).then(a => console.log("Local description set successfully."))
//     submitRemoteBtn.disabled = false
//     submitRemoteBtn.onclick = () => {
//         submitRemoteBtn.disabled = true
//         const answer = JSON.parse(remoteOfferBox.value)
//         lc.setRemoteDescription(answer)
//     }
// }

// function createRemoteConnection() {
//     submitRemoteBtn.disabled = true
//     localOfferBox.disabled = false

//     const offer: RTCSessionDescription = JSON.parse(remoteOfferBox.value)
//     const rc: RTCPeerConnection = new RTCPeerConnection(SERVERS)
//     rc.onicecandidate = e => {
//         console.log("Created new ICE candidate.")
//         localOfferBox.textContent = JSON.stringify(rc.localDescription)
//     }
//     rc.ondatachannel = dataChannel => {
//         var dc: RTCDataChannel = dataChannel.channel
//         dc.onmessage = message => {
//             dataHandler(message, dc);
//         }
//         dc.onopen = e => console.log("Connection opened.")
//         startChatBox(dc);
//         startFileBox(dc);
//     }
//     rc.setRemoteDescription(offer).then(a => console.log("Offer set."));
//     rc.createAnswer().then(answer => rc.setLocalDescription(answer)).then(a => console.log("Answer created."))
// }

// function dataHandler(message: MessageEvent, dataChannel: RTCDataChannel) {
//     //console.log("Type of data: " + typeof(message.data));

//     if (typeof(message.data) != "string") {
//         const chunk: any = message.data;
//         chunks.push(chunk);
//         //console.log(fileHeader.numChunks);
//         console.log(dataChannel);
//         dataChannel.send(JSON.stringify({
//             type: 'progress',
//             progress: (chunks.length / fileHeader.chunkcount)
//         }))
//         // progressBar.value = chunks.length / fileHeader.chunkcount;
//         if (chunks.length == fileHeader.chunkcount) {
//             const blob = new Blob(chunks);
//             createDownloadable(blob, fileHeader.filename);
//             // progressBar.value = 1;
//         }
//     } else {
//         var msg: any = JSON.parse(message.data)

//         switch (msg.type) {
//             case 'text':
//                 // recieveBox.textContent = message.data
//                 break;
//             case 'header':
//                 chunks = []
//                 fileHeader = msg
//                 console.log(fileHeader);
//                 break;
//             case 'progress':
//                 // progressBar.value = msg.progress;
//         }

//     }





    // if (typeof(message.data) == "string") {

    //     if (message.data.startsWith("%/chunkcount")) {
    //         chunks = [];
    //         chunkcount = parseInt(message.data.replace("%/chunkcount", ""));
    //         console.log("Hello123 " + chunkcount)
    //     }
    //     // else 
    //     console.log("Hello");
    //     recieveBox.textContent = message.data
    //     console.log("Hello123 " + chunkcount)
    // } else if (typeof(message.data) == "object") {
        
    // }
//}

// function startChatBox(dataChannel: RTCDataChannel) {
//     sendBox.disabled = false
//     localOfferBox.disabled = true
//     remoteOfferBox.disabled = true
//     connectionMsg.textContent = "Connection Opened. You can now send messages."

//     submitTextBtn.onclick = () => {
//         dataChannel.send(sendBox.value)
//         sendBox.value = "";
//     }
// }

// function startFileBox(dataChannel: RTCDataChannel) {
//     fileUploadBtn.onclick = () => {
//         if (fileInput.files !== null) {
//             const file: File = fileInput.files[0];
//             const chunkSize = 64 * 1024;
//             const numChunks = Math.ceil(file.size / chunkSize);
//             dataChannel.send(JSON.stringify({
//                 type: 'header',
//                 filename: file.name,
//                 filetype: file.type,
//                 filesize: file.size,
//                 chunksize: chunkSize,
//                 lastchunksize: (file.size % chunkSize),
//                 chunkcount: numChunks
//             }))
//             sliceAndSend(dataChannel, file, chunkSize, 0);
//         }
        
//     }
// }

function sliceAndSend(dataChannel: RTCDataChannel, file: File, chunkSize: number, offset: number) {
    const chunk: Blob = file.slice(offset, offset + chunkSize);
    const reader: FileReader = new FileReader();
    reader.onload = function(event) {
        if (dataChannel.bufferedAmount + chunkSize >= 16 * 1024 * 1024) {
            console.log("Waiting...");
            setTimeout(() => {
                sliceAndSend(dataChannel, file, chunkSize, offset);
            }, 100)
        } else if (offset <= file.size){
            if (event.target !== null && event.target.result !== null && typeof(event.target.result) !== 'string') {
                dataChannel.send(event.target.result);
            }
            sliceAndSend(dataChannel, file, chunkSize, offset + chunkSize);
        } else {
            console.log("Done sending!");
        }
        
    }
    reader.readAsArrayBuffer(chunk);
}

// function sendChunk(chunk, dataChannel, num) {
    
//     if (dataChannel.bufferedAmount + chunk.byteLength >= 16 * 1024 * 1024) {
//         console.log("Waiting...");
//         setTimeout(() => {
//             sendChunk(chunk, dataChannel, num);
//         }, 1000)
//     } else {
//         // console.log(chunk.byteLength);
//         // console.log("Buffer: " + dataChannel.bufferedAmount); 
//         // console.log("Threshold: " + dataChannel.bufferedAmountLowThreshold); 
//         console.log("Chunk Num: " + num);
//         dataChannel.send(chunk);
//     }
// }

function createDownloadable(blob: Blob, fileName: string) {

    // Create a new download link element
    const downloadLink = document.createElement('a');
  
    // Set the download link attributes
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = fileName;
  
    // Simulate a click on the download link
    downloadLink.click();
  
    // Clean up the URL object
    URL.revokeObjectURL(downloadLink.href);
}

export default PeerConnection