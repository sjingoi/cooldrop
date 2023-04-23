import React, { Component } from 'react';
import Peer from "./Peer";

function Peers({peers}) {
    return (
        <>
        <h1>PEERS:</h1>
            {peers.map(peer => {
                return <Peer key={peer.remote_uuid} peer={peer}/>
            })}
        </>
    )
}
export default Peers;