//import React from 'react';
import PeerConnection from '../scripts/peer-connection';
import { useState, useRef } from 'react';
import './peer.css'

interface Props {
    peer: PeerConnection
}

function Peer ({peer}: Props) {
    const [progress, setProgress] = useState(0);
    const fileBoxRef = useRef<HTMLInputElement>(null);

    console.log("peer id: " + peer.get_remote_id());

    peer.on_progess = (value => setProgress(value));

    function handleSendFile() {
        console.log("Sending file to peer id: " + peer.get_remote_id());
        if (fileBoxRef.current === null || fileBoxRef.current.files === null) {
            console.log("file box is null")
            return
        }
        const file = fileBoxRef.current.files[0];
        console.log("Sending file to peer id: " + peer.get_remote_id());
        
        peer.send_file(file);
    }

    return (
        <>
            <p className='name'>{peer.get_remote_id()}</p>
            <div className='iconph'></div>
            <progress value={progress} className='progress'></progress>
            <input type="file" ref={fileBoxRef} id='file'></input>
            <button onClick={handleSendFile} id='send-file'></button>
            <ul className='buttons'>
                <li className='input-file'><label htmlFor='file' className='label'>CHOOSE FILE</label></li>
                <li className='send-file'><label htmlFor='send-file' className='label'>{peer.get_remote_id()}</label></li>
            </ul>
            
            
        </>
    )
}

export default Peer;