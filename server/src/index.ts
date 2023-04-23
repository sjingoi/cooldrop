import { Socket } from "dgram";

const { v4: uuidv4 } = require('uuid');
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

interface SDP_Package {
    type: string,
    recipient: string,
    connection_id: string,
    ice_candidate: RTCIceCandidate,
    sdp:  RTCSessionDescription
}

interface Conncetion_Info {
    type: 'uuid',
    uuid: string
}

var clients: Client[] = [];

class Client {
    public socket: Socket;
    public uuid: string;

    public constructor(socket: Socket, uuid: string) {
        socket.on("message", message => { this.message_handler(message) });
        socket.on("disconnect", () => { this.close_handler() });
        this.socket = socket;
        this.uuid = uuid;
    }

    public send(sdp: SDP_Package) {
        this.socket.send(JSON.stringify(sdp));
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
            //console.log(message);
            try {
                var pkg: SDP_Package = JSON.parse(message);
                if (pkg.type == 'sdp') {
                    console.log("Recieved SDP");
                    var remote_client = get_client(pkg.recipient);
                    if (remote_client != null) {
                        console.log("Sending SDP to remote client.");
                        remote_client.send(pkg);
                    } else {
                        console.log("Remote client UUID not found.");
                    }
                }
            } catch {
                console.log("Something went wrong.")
            }
        }
    }
    
    private close_handler() {
        var index: number = clients.indexOf(this);
        if (index > -1) {
            clients.splice(index, 1);
        }
        console.log("Closing connection");
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

http.listen(8080, () => console.log("Listening on http://localhost:8080"));