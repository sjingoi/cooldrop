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
    connection_id: string,
    ice_candidate: RTCIceCandidate,
    sdp: any
}

interface Init {
    uuid: string,
    name: string
}

interface Conncetion_Info {
    type: 'uuid',
    uuid: string
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
        //console.error("Good error");
        this.socket.emit("generate sdp", JSON.stringify({
            recipient: this.uuid,
            sender: recipient_uuid,
            connection_id: uuidv4()
        }));
    }

    private message_handler(message: any) {
        console.log("DEPRACATED FUNCTION CALLED");
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

function setup_client(client_info: any, socket: Socket) {
    let uuid: string = client_info.uuid;
    let name: string = client_info.name;

    if (get_client(uuid) != null) {
        console.log("Client " + uuid + " already exists!");
        return;
    }
    if (uuid === undefined) {
        console.log("Client UUID is undefined.");
        return;
    }

    var client: Client = new Client(socket, uuid);

    // Make all clients aware of the new client to begin the signaling process.
    for (var i: number = 0; i < clients.length; i++) {
        clients[i].request_sdp(uuid);
    }

    clients.push(client);
    console.log("Client " + name + " " + uuid + " initialized.");
    console.log("There are " + clients.length + " clients initialized.");
}

io.on('connection', (socket: Socket) => {
    socket.on("sdp", (message: any) => {
        if (typeof(message) === 'string') {
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
        } else {
            console.log("Invalid sdp message.");
        }
    })
    
    socket.on("init", (message: any) => {
        if (typeof(message) === 'string') {
            var client_info: Init = JSON.parse(message);
            setup_client(client_info, socket);
        } else {
            console.log("Invalid init message.");
        }
    });
})

app.get('/hello', (req: any, res: any) => {
    console.log("Req")
    res.status(200).send("Hello there!").end();
})

app.use(express.static("./public"));

server.listen(PORT, "10.0.0.4", () => console.log(`Listening on port ${PORT}`));
//server.listen(PORT, "192.168.0.60", () => console.log(`Listening on port ${PORT}`));
