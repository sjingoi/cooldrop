import { useState, useEffect } from 'react';
import socket from '../scripts/socket';
import PeerConnection from '../scripts/peer-connection';
import Peer from './Peer';
import { v4 as uuidv4 } from 'uuid';
import './peermanager.css'

var local_uuid: string;
var connections: PeerConnection[] = [];

interface Props {
    updateName: any;
}

function PeerManager(props: Props) {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [peers, setPeers] = useState<PeerConnection[]>([]);
    //console.log("New render")
    //console.log(peers);

    let uuid = localStorage.getItem("uuid");
    let name = localStorage.getItem("name");
    if (uuid === null) {
        local_uuid = uuidv4();
        localStorage.setItem("uuid", local_uuid);
    } else {
        local_uuid = uuid;
    }

    useEffect(() => {
        console.log("Rendered");

        

        socket.emit("init", JSON.stringify({
            "uuid": local_uuid,
            "name": "test",
        }));

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

        function onSDP(message: any) {
            console.log("Recieved SDP");
            var msg = JSON.parse(message);
            const peer = getPeer(msg.connection_id);
            if (peer !== undefined) {
                console.log("Setting remote for " + peer.get_remote_id())
                peer.remote_name = msg.sender_name;
                peer.set_remote(msg.sdp);
            } else {
                createConnection(msg);
            }
        }

        function onReqSDPGen(message: any) {
            var msg = JSON.parse(message);
            console.log("New peer found. Creating new connection.");
            createConnection(msg);
        }

        function sendToServer(type: string, pkg: any) {
            pkg.sender = local_uuid;
            pkg.sender_name = name;
            socket.emit(type, JSON.stringify(pkg));
        }
        
        function createConnection(params?: any) {
            
            let new_peer: PeerConnection = new PeerConnection(params.connection_id, params.sender_name, params.sender, sendToServer, params.sdp);
            
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
        socket.on("message", message => console.error("DEPRACTED ONMESSAGE"));
        socket.on("sdp", message => onSDP(message));
        socket.on("generate sdp", message => onReqSDPGen(message));


        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("message");
            socket.off("sdp");
            socket.off("generate sdp");
        }
    }, [])

    return (
        <>
            <p>Connection Status: </p>
            {isConnected ? <p style={{color: "green"}}>Connected</p> : <p style={{color: "red"}}>Disconnected</p>}
            <p style={{cursor: "pointer"}} onClick={() => props.updateName(null)}>Your Name: {name}</p>
            <p>Your ID: {local_uuid}</p>
            <ul className='peer-list'>
                {peers.length === 0 && 
                    <div style={{display: "flex", flexDirection: "column"}}>
                        <p style={{marginTop: "8", marginBottom: "0px"}}>No peers are currently connected. Open CoolDrop on another device, or wait for others to join.</p>
                        <p style={{marginTop: "8px", fontSize: "14px", color: "#888"}}>Tip: If you are having issues connecting, try refreshing the page.</p>
                    </div>
                }
                {peers.map(peer => (
                    <li key={peer.connection_id}>
                        <Peer peer={peer} id={peer.get_remote_id()} name={peer.remote_name}/>
                    </li>
                ))}
            </ul>
        </>
    )
}

export default PeerManager