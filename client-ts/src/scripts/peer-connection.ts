interface FileHeader {
    type: 'header',
    filename: string,
    filetype: string,
    filesize: number,
    chunksize: number,
    lastchunksize: number,
    chunkcount: number
}

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
            urls:["stun:stun1.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "turn:cool.drop.cc:3478"],
            username: "guest",
            credential: "somepassword",
        }
    ]
}

class PeerConnection {
    private connection: RTCPeerConnection;
    private datachannel?: RTCDataChannel;
    private local_uuid: string;
    private remote_uuid: string;
    private send: any;
    private chunks: any[] = [];
    private file_header?: FileHeader = undefined;
    public connection_id: string;
    public on_open = (event: Event) => {}
    public on_close = (event: Event) => {}
    public on_progess = (progress: number) => {};


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

    private on_open_connection(event: Event) {
        console.log("Connection Opened!");
        this.on_open(event);
    }

    private on_close_connection(event: Event) {
        console.log("Connection Closed.");
        this.on_close(event);
    }

    private on_ice(event: RTCPeerConnectionIceEvent) {
        console.log(event.candidate);
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

    private message_handler(message: MessageEvent) {
        const dataChannel = this.datachannel;

        if (dataChannel === undefined) {
            console.log("Data channel not initialized.");
            return;
        }
        //console.log("Type of data: " + typeof(message.data));
    
        if (typeof(message.data) !== "string") {
            if (this.file_header === undefined) {
                console.log("Recieving data without file header!");
                return;
            }
            const chunk: any = message.data;
            this.chunks.push(chunk);
            //console.log(fileHeader.numChunks);
            console.log(dataChannel);
            dataChannel.send(JSON.stringify({
                type: 'progress',
                progress: (this.chunks.length / this.file_header.chunkcount)
            }))

            this.on_progess(this.chunks.length / this.file_header.chunkcount);
            
            if (this.chunks.length == this.file_header.chunkcount) {
                const blob = new Blob(this.chunks);
                createDownloadable(blob, this.file_header.filename);
                this.chunks = [];
                this.file_header = undefined;
                this.on_progess(1);
                // progressBar.value = 1;
            }
        } else {
            var msg: any = JSON.parse(message.data)
    
            switch (msg.type) {
                case 'text':
                    // recieveBox.textContent = message.data
                    break;
                case 'header':
                    this.chunks = []
                    this.file_header = msg
                    console.log(this.file_header);
                    break;
                case 'progress':
                    this.on_progess(msg.progress);
                    // progressBar.value = msg.progress;
                    break;
                default:
                    console.log('unknown message type: ' + msg.type);
            }
    
        }
    }

    private send_header(file: File, chunkSize: number) {
        if (this.datachannel === undefined) {
            console.log("Data channel not initialized.");
            return;
        }
        const numChunks = Math.ceil(file.size / chunkSize);
        this.datachannel.send(JSON.stringify({
            type: 'header',
            filename: file.name,
            filetype: file.type,
            filesize: file.size,
            chunksize: chunkSize,
            lastchunksize: (file.size % chunkSize),
            chunkcount: numChunks
        }))
    }

    private file_sender(file: File, chunkSize: number, offset: number) {
        const chunk: Blob = file.slice(offset, offset + chunkSize);
        const reader: FileReader = new FileReader();

        // if (offset == 0) this.send_header(file, chunkSize);

        const this_connection = this;
        const dataChannel = this.datachannel;
        if (dataChannel === undefined) {
            console.log("Data channel not initialized.");
            return;
        }
        reader.onload = function(event) {
            if (dataChannel.bufferedAmount + chunkSize >= 16 * 1024 * 1024) {
                console.log("Waiting...");
                setTimeout(() => {
                    this_connection.file_sender(file, chunkSize, offset);
                }, 100)
            } else if (offset <= file.size){
                if (event.target !== null && event.target.result !== null && typeof(event.target.result) !== 'string') {
                    dataChannel.send(event.target.result);
                }
                this_connection.file_sender(file, chunkSize, offset + chunkSize);
            } else {
                console.log("Done sending!");
            }
            
        }
        reader.readAsArrayBuffer(chunk);
    }

    public send_file(file: File) {
        const chunkSize = 64*1024;
        this.send_header(file, chunkSize);
        this.file_sender(file, chunkSize, 0);
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
        
        
//     }
// }



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