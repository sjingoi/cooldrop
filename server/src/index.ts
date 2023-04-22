import { Socket } from "dgram";

const { v4: uuidv4 } = require('uuid');
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

interface SDP_Request {
    type: string,
    recipient: string,
    sdp: string
}

var clients: Client[];

class Client {
    public socket: Socket;
    public uuid: string;

    public constructor(socket: Socket, uuid: string) {
        socket.on("message", message => { this.message_handler(message) });
        this.socket = socket;
        this.uuid = uuid;
    }

    public send_sdp(sdp: SDP_Request) {
        this.socket.send(JSON.stringify(sdp));
    }

    public request_sdp(recipient_uuid: string) {
        this.socket.send(JSON.stringify({
            type: "generate sdp",
            recipient: recipient_uuid
        }));
    }

    private message_handler(message: any) {
        if (typeof(message) == 'string') {
            var sdp: SDP_Request = JSON.parse(message);
            if (sdp.type == 'offer' || sdp.type == 'answer') {
                var remote_client = get_client(sdp.recipient);
                if (remote_client != null) {
                    remote_client.send_sdp(sdp);
                } else {
                    console.log("Remote client UUID not found.");
                }
            }
        }
    }
}

function get_client(uuid: string) {
    // This will be a linear search for now. This will be converted to a binary search.
    for (var i: number = 0; i < clients.length; i++) {
        if (uuid === clients[i].uuid) {
            return clients[i];
        }
    }
    return null;
}

io.on('connection', (socket: Socket) => {
    var client_uuid: string = uuidv4();
    var client: Client = new Client(socket, client_uuid);
    for (var i: number = 0; i < clients.length; i++) {
        clients[i].request_sdp(client_uuid);
    }
    clients.push(client);
})

http.listen(8080, () => console.log("Listening on http://localhost:8080"));