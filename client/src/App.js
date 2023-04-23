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

var peer_handler;

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
  if (typeof(message) === 'string') {
    var msg = JSON.parse(message);
    if (msg.type == 'generate sdp') {
      //console.log(msg)
      console.log("Creating new peer connection");
      let new_peer = new PeerConnection(msg.connection_id, msg.recipient, msg.sender, (pkg) => {socket.send(JSON.stringify(pkg))});
      peer_list.push(new_peer);
      peer_handler(new_peer);


    } else if (msg.type == 'sdp') {
      console.log("Recieved SDP");
      let peer = get_peer(msg.connection_id)
      if (peer !== undefined) {
        peer.set_remote(msg.sdp);
      } else {
        console.log("Connection id not found, creating new conncetion.");
        let new_peer = new PeerConnection(msg.connection_id, msg.recipient, msg.sender, (pkg) => {socket.send(JSON.stringify(pkg))}, msg.sdp);
        peer_list.push(new_peer);
        peer_handler(new_peer);
      }


    } else if (msg.type == 'uuid') {
      local_uuid = msg.uuid;
      console.log("Set local uuid.");
    }
  }
}


function App() {
  const [peers, setPeers] = useState([]);

  function on_new_peer(new_peer) {
    setPeers(prevPeers => {
      console.log(peer_list);
      return [...prevPeers, new_peer]
    })
  }

  peer_handler = on_new_peer;

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
