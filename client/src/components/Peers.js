import React, { Component } from 'react';
import Peer from "./Peer";

function Peers({peers}) {
    return (
        <>
        <h1>PEERS:</h1>
            {peers.map(peer => {
                return <Peer peer={peer}/>
            })}
        </>
    )
}
export default Peers;