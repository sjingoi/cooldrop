//import './App.css';
import React, { useState, useRef } from 'react';
import Title from "./components/Title";
import Legacy from "./components/Legacy"
import Header from "./components/Header";
import Peers from "./components/Peers";
import PeerConnection from "./dist/peer-connection"

import io from 'socket.io-client';

const socket = io('ws://localhost:8080')
socket.on("message", message => {message_handler(message)});


var local_uuid;
var on_new_connection;
var peer_list = [];

function get_peer(connection_id) {
    for (let i = 0; i < peer_list.length; i++) {
        if (peer_list[i].connection_id == connection_id) {
            return peer_list[i];
        }
    }
    return undefined;
}


function message_handler(message) {
    if (typeof(message) !== 'string') return;

    var msg = JSON.parse(message);

    switch(msg.type) {

        case 'uuid':
            local_uuid = msg.uuid;
            break;

        case 'generate sdp':
            create_new_connection(msg);
            break;

        case 'sdp':
            const peer = get_peer(msg.connection_id)
            if (peer !== undefined) {
                peer.set_remote(msg.sdp);
            } else {
                create_new_connection(msg);
            }
            break;

    }
}

function create_new_connection(params) {
    let new_peer;
        
    new_peer = new PeerConnection(params.connection_id, params.recipient, params.sender, (pkg) => socket.send(JSON.stringify(pkg)), params.sdp);
    
    new_peer.on_open = e => {
        console.log("Test On Open");

    }
    peer_list.push(new_peer);
    on_new_connection(new_peer);
}


function App() {
const [peers, setPeers] = useState([]);






function on_new_peer(new_peer) {
    setPeers(prevPeers => {
        //console.log(peer_list);
        return [...prevPeers, new_peer]
    })
    }

    on_new_connection = on_new_peer;

    return (
    <div>
        {/* <Header />
        <Title />
        <Legacy /> */}
        <Peers peers={peers}/>
    </div>
    );
}

export default App;

        // if (msg.type == 'generate sdp') {
        //     create_new_connection(msg);
        //   } 
        //   else if (msg.type == 'sdp') {
        //     const peer = get_peer(msg.connection_id)
        //     if (peer !== undefined) {
        //       peer.set_remote(msg.sdp);
        //     } else {
        //       create_new_connection(msg);
        //     }
      
        //   } 
        //   else if (msg.type == 'uuid') {
        //     local_uuid = msg.uuid;
        //     console.log("Set local uuid.");
        //   }