import { Socket } from "dgram";

const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

var PORT: number = 80;

if (process.env.PORT !== undefined) {
    PORT = parseInt(process.env.PORT)
}

interface Package {
    type: string,
    sender: string,
    recipient: string,
    //connection_id: string,
    ice_candidate: RTCIceCandidate,
    sdp: any
}

interface Connection_Info {
    type: 'uuid',
    uuid: string
}

interface Init {
    uuid: string,
    name: string
}

var clients: Client[] = [];

function get_client(uuid: string) {
    // This will be a linear search for now. This will be converted to a binary search.
    for (var i: number = 0; i < clients.length; i++) {
        if (uuid === clients[i].uuid) {
            return clients[i];
        }
    }
    return null;
}

class Client {
    public socket: Socket;
    public uuid: string;

    public constructor(socket: Socket, uuid: string) {
        socket.on("message", message => { this.message_handler(message) });
        socket.on("disconnect", () => { this.close_handler() });
        this.socket = socket;
        this.uuid = uuid;
    }

    public send(pkg: any) {
        this.socket.send(JSON.stringify(pkg));
    }

    public request_sdp(recipient_uuid: string) {
        this.socket.send(JSON.stringify({
            type: "generate sdp",
            recipient: this.uuid,
            sender: recipient_uuid,
            //connection_id: uuidv4()
        }));
    }

    private message_handler(message: any) {
        console.log("DEPRACTED");
        if (typeof(message) === 'string') {
            //l,;l;,,console.log(message);
            
            // var pkg: Package = JSON.parse(message);
            // if (pkg.type === 'sdp') {
            //     // console.log("Recieved SDP");
            //     // var remote_client = get_client(pkg.recipient);
            //     // if (remote_client != null) {
            //     //     console.log("Sending SDP " + pkg.sdp.type + " to remote client.");
            //     //     remote_client.send(pkg);
            //     // } else {
            //     //     console.log("Remote client UUID not found.");
            //     // }
            // } else if (pkg.type == 'presence') {
            //     for (var i: number = 0; i < clients.length; i++) {
            //         if (clients[i] != this) {
            //             clients[i].request_sdp(this.uuid);
            //         }
            //     }
            // }
            
        }
    }
    
    private close_handler() {
        var index: number = clients.indexOf(this);
        if (index > -1) {
            clients.splice(index, 1);
        }

        // clients.map(client => this.send({
        //     type: 'close',
        //     remote_id: this.uuid
        // }))

        console.log("Closing connection");
    }
}

function create_client(client_info: Init, socket: Socket) {

    let uuid: string = client_info.uuid;
    let name: string = client_info.name;

    if (get_client(uuid) != null) {
        console.log("Client " + uuid + " already exists!");
        return;
    }
    if (uuid !== undefined) {

        var client: Client = new Client(socket, uuid);

        for (var i: number = 0; i < clients.length; i++) {
            clients[i].request_sdp(uuid);
        }
        clients.push(client);
        console.log("Client " + name + " " + uuid + " initialized.");
        console.log("There are " + clients.length + " clients initialized.");
    }
}

io.on('connection', (socket: Socket) => {
    socket.on('init', (message: string) => {
        if (typeof(message) === 'string') {
            var client_info: Init = JSON.parse(message);
            create_client(client_info, socket);
        } else {
            console.log("Invalid init message.");
        }
    });

    socket.on('sdp', (message: string) => {
        console.log("Recieved SDP");
        
        let pkg: Package = JSON.parse(message);
        let remote_client = get_client(pkg.recipient);
        let sender_client = get_client(pkg.sender);

        if (sender_client != null) {
            console.log("Recieved SDP from " + sender_client.uuid + " client.");
        } else {
            console.log("Sender client UUID not found.");
        }

        if (remote_client != null) {
            console.log("Sending SDP to " + remote_client.uuid + " client.");
            remote_client.socket.emit('sdp', message);
        } else {
            console.log("Remote client UUID not found.");
        }
    });
})



io.on('message', (message: any, ) => {
    console.log("Legacy message: " + message);
});


app.get('/hello', (req: any, res: any) => {
    console.log("Req")
    res.status(200).send("Hello there!").end();
})

app.use(express.static("./public"));

//server.listen(PORT, "10.0.0.4", () => console.log(`Listening on port ${PORT}`));
server.listen(PORT, "192.168.0.60", () => console.log(`Listening on port ${PORT}`));
