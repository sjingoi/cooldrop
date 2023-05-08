import { Socket } from "dgram";

const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

var PORT: number = 8080;

if (process.env.PORT !== undefined) {
    PORT = parseInt(process.env.PORT)
}

interface Package {
    type: string,
    recipient: string,
    connection_id: string,
    ice_candidate: RTCIceCandidate,
    sdp: any
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
        this.socket.send(JSON.stringify({
            type: "generate sdp",
            recipient: this.uuid,
            sender: recipient_uuid,
            connection_id: uuidv4()
        }));
    }

    private message_handler(message: any) {
        if (typeof(message) === 'string') {
            //l,;l;,,console.log(message);
            
            var pkg: Package = JSON.parse(message);
            if (pkg.type === 'sdp') {
                console.log("Recieved SDP");
                var remote_client = get_client(pkg.recipient);
                if (remote_client != null) {
                    console.log("Sending SDP " + pkg.sdp.type + " to remote client.");
                    remote_client.send(pkg);
                } else {
                    console.log("Remote client UUID not found.");
                }
            } else if (pkg.type == 'presence') {
                for (var i: number = 0; i < clients.length; i++) {
                    if (clients[i] != this) {
                        clients[i].request_sdp(this.uuid);
                    }
                }
            }
            
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

io.on('connection', (socket: Socket) => {
    var client_uuid: string = uuidv4();

    var uuid_pkg: Conncetion_Info = {
        type: 'uuid',
        uuid: client_uuid
    }
    socket.send(JSON.stringify(uuid_pkg));

    var client: Client = new Client(socket, client_uuid);
    console.log("There are " + clients.length + " clients connected.");

    for (var i: number = 0; i < clients.length; i++) {
        clients[i].request_sdp(client_uuid);
    }
    
    clients.push(client);
})

app.get('/hello', (req: any, res: any) => {
    console.log("Req")
    res.status(200).send("Hello there!").end();
})

app.use(express.static("./public"));

server.listen(PORT, "0.0.0.0", () => console.log(`Listening on port ${PORT}`));