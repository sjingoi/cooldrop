//import React from 'react';
import PeerConnection from '../scripts/peer-connection';
import { useState, useRef } from 'react';

interface Props {
    peer: PeerConnection
}

function Peer ({peer}: Props) {
    const [progress, setProgress] = useState(0);
    const fileBoxRef = useRef<HTMLInputElement>(null);

    peer.on_progess = (value => setProgress(value));

    function handleSendFile() {
        if (fileBoxRef.current === null || fileBoxRef.current.files === null) {
            console.log("file box is null")
            return
        }
        const file = fileBoxRef.current.files[0];
        peer.send_file(file);
    }

    return (
        <div>
            <p>{peer.get_remote_id()}</p>
            <input type="file" ref={fileBoxRef}></input>
            <button onClick={handleSendFile}>Send</button>
            <progress id="file_progess" value={progress}></progress>
        </div>
    )
}

export default Peer;