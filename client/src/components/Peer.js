import React from 'react';
import PeerConnection from "../dist/peer-connection"



function Peer ({peer}) {

    return (
        <div>
            <p>{peer.remote_uuid}</p>
        </div>
    )
}

export default Peer;