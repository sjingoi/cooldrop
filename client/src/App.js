//import './App.css';
import React, { useState } from 'react';
import Title from "./components/Title";
import Legacy from "./components/Legacy"
import Header from "./components/Header";
import Peers from "./components/Peers";
import PeerConnection from "./dist/peer-connection"

import io from 'socket.io-client';

const socket = io('ws://localhost:8080')
socket.on("message", message => {message_handler(message)});

var peer_list = [];

var local_uuid;

//var peer1 = new PeerConnection("69", (pkg) => {socket.send(JSON.stringify(pkg))});

//var peer2 = new PeerConnection("420");

function message_handler(message) {
  if (typeof(message) === 'string') {
    var msg = JSON.parse(message);
    if (msg.type == 'generate sdp') {
      //console.log(msg)
      console.log("Creating new peer connection");
      let new_peer = new PeerConnection(msg.connection_id, msg.recipient, msg.sender, (pkg) => {socket.send(JSON.stringify(pkg))});
      peer_list.push(new_peer);


    } else if (msg.type == 'ice') {
      let peer = get_peer(msg.connection_id)
      if (peer !== undefined) {
        peer.add_ice_candidate(msg.ice_candidate);
      } else {
        console.log("Connection id not found.");
      }


    } else if (msg.type == 'sdp') {
      console.log("Recieved SDP");
      let peer = get_peer(msg.connection_id)
      if (peer !== undefined) {
        peer.set_remote(msg.sdp);
      } else {
        console.log("Connection id not found, creating new conncetion.");
        let new_peer = new PeerConnection(msg.connection_id, msg.recipient, msg.sender, (pkg) => {socket.send(JSON.stringify(pkg))}, msg.sdp);
        peer_list.push(new_peer);
      }
    } else if (msg.type == 'uuid') {
      local_uuid = msg.uuid;
      console.log("Set local uuid.");
    }
  }
}

function get_peer(connection_id) {
  for (let i = 0; i < peer_list.length; i++) {
    if (peer_list[i].connection_id == connection_id) {
      return peer_list[i];
    }
  }
  return undefined;
}

function App() {
  const [peers] = useState(['wtf']);
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
