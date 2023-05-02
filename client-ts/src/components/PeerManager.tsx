import React, { useState, useEffect } from 'react';
import socket from '../scripts/socket';
import PeerConnection, { Package } from '../scripts/peer-connection';
import Peer from './Peer';

var local_uuid: string;
var connections: PeerConnection[] = [];

function PeerManager() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [peers, setPeers] = useState<PeerConnection[]>([]);
    //console.log("New render")
    //console.log(peers);
    

    useEffect(() => {
        console.log("Rendered");
        //console.log("Hello")
        
        //var peer_list: PeerConnection[] = [];

        function getPeer(connection_id: string) {
            //console.log(connections);
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

            //console.log(peers)
        
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
        
        function createConnection(params?: any) {
            
            let new_peer: PeerConnection = new PeerConnection(params.connection_id, params.recipient, params.sender, (pkg: Package) => socket.send(JSON.stringify(pkg)), params.sdp);
            
            new_peer.on_open = () => {
                //console.log("Test On Open");
                
                setPeers(prevPeers => {
                    return [...prevPeers, new_peer]
                });
            }
            new_peer.on_close = () => {
                console.log("Test closed")
                //console.log(peers);
                //let index = peers.indexOf(new_peer);
                //let remainingPeers = peers.filter(peer => peer == new_peer);
                setPeers(prevPeers => {
                    return prevPeers .filter(peer => peer.connection_id !== new_peer.connection_id);
                });
            }
            connections.push(new_peer);
            console.log("Creating peer with id " + new_peer.get_remote_id())
            
        }

        socket.on("connect", () => onConnect());
        socket.on("disconnect", () => onDisconnect());
        socket.on("message", message => onMessage(message));

        return () => {
            //setPeers([]);
            socket.off("connect");
            socket.off("disconnect");
            socket.off("message");
          }
    }, [])

    //console.log(peers)

    return (
        <>
            <p>Connection Status: </p>
            {isConnected ? <p style={{color: "green"}}>Connected</p> : <p style={{color: "red"}}>Disconnected</p>}
            <p>Your ID: {local_uuid}</p>
            <h1>Peers:</h1>
            <ul>
                {peers.map(peer => <li key={peer.connection_id}><Peer peer={peer} key={peer.connection_id}/></li>)}
            </ul>
        </>
    )
}

export default PeerManager