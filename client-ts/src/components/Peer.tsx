import React from 'react';
import PeerConnection from '../scripts/peer-connection';

interface Props {
    peer: PeerConnection
}

function Peer ({peer}: Props) {

    return (
        <div>
            <p>{peer.get_remote_id()}</p>
            <input type="file"></input>
        </div>
    )
}

export default Peer;