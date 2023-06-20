import { useState, useEffect } from 'react';
import socket from '../scripts/socket';
import PeerConnection from '../scripts/peer-connection';
import Peer from './Peer';
import './peermanager.css'

var local_uuid: string;
var connections: PeerConnection[] = [];

function PeerManager() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [peers, setPeers] = useState<PeerConnection[]>([]);
    //console.log("New render")
    //console.log(peers);
    

    useEffect(() => {
        console.log("Rendered");

        function getPeer(connection_id: string) {
            for (let i = 0; i < connections.length; i++) {
                if (connections[i].connection_id == connection_id) {
                    return connections[i];
                }
            }
            return undefined;
        }

        function onConnect() {
            console.log("Connected to Server.");
            setPeers([]);
            setIsConnected(true);
        }

        function onDisconnect() {
            console.log("Disconnected from Server.");
            setPeers([]);
            setIsConnected(false);
        }
        
        function onMessage(message: any) {

            if (typeof(message) !== 'string') return;

            console.log("Reieved Message.")
        
            var msg = JSON.parse(message);

            switch(msg.type) {
        
                case 'uuid':
                    local_uuid = msg.uuid;
                    break;
        
                case 'generate sdp':
                    console.log("New peer found. Creating new connection.")
                    createConnection(msg);
                    break;
        
                case 'sdp':
                    const peer = getPeer(msg.connection_id)
                    if (peer !== undefined) {
                        console.log("Setting remote for " + peer.connection_id)
                        peer.set_remote(msg.sdp);
                    } else {
                        createConnection(msg);
                    }
                    break;
            }
        }

        function onSDP(message: any) {
            console.log("Recieved SDP");
            var msg = JSON.parse(message);
            const peer = getPeer(msg.connection_id);
            if (peer !== undefined) {
                console.log("Setting remote for " + peer.get_remote_id())
                peer.set_remote(msg.sdp);
            } else {
                createConnection(msg);
            }
        }

        function sendToServer(type: string, pkg: any) {
            pkg.sender = local_uuid;
            socket.emit(type, JSON.stringify(pkg));
        }
        
        function createConnection(params?: any) {
            
            let new_peer: PeerConnection = new PeerConnection(params.connection_id, params.sender, sendToServer, params.sdp);
            
            new_peer.on_open = () => {
                setPeers(prevPeers => {
                    return [...prevPeers, new_peer]
                });
            }
            new_peer.on_close = () => {
                setPeers(prevPeers => {
                    return prevPeers .filter(peer => peer.connection_id !== new_peer.connection_id);
                });
            }
            connections.push(new_peer);
            console.log("Created peer with id " + new_peer.get_remote_id())
        }

        socket.on("connect", () => onConnect());
        socket.on("disconnect", () => onDisconnect());
        socket.on("message", message => onMessage(message));
        socket.on("sdp", message => onSDP(message));


        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("message");
            socket.off("sdp");
        }
    }, [])

    return (
        <>
            <p>Connection Status: </p>
            {isConnected ? <p style={{color: "green"}}>Connected</p> : <p style={{color: "red"}}>Disconnected</p>}
            <p>Your ID: {local_uuid}</p>
            <h1>Peers:</h1>
            <ul className='peer-list'>
                {peers.length === 0 && <p style={{marginTop: "8%"}}>No peers are currently connected. Open CoolDrop on another device, or wait for others to join.</p>}
                {peers.map(peer => (
                    <li key={peer.connection_id}>
                        <Peer peer={peer} id={peer.get_remote_id()}/>
                    </li>
                ))}
            </ul>
        </>
    )
}

export default PeerManager