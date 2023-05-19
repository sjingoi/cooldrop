//import React from 'react';
import PeerConnection from '../scripts/peer-connection';
import { useState, useRef } from 'react';
import './peer.css'

interface Props {
    peer: PeerConnection
    id: String
}

function Peer (props: Props) {
    const [progress, setProgress] = useState(0);
    const fileBoxRef = useRef<HTMLInputElement>(null);

    let peer = props.peer;
    let id = props.id;
    

    console.log("peer id: " + peer.get_remote_id());
    console.log(props)

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
            <input type="file" ref={fileBoxRef} id={"file-" + id}></input>
            <button onClick={handleSendFile} id={"input-" + id}></button>
            <ul className='buttons'>
                <li className='input-file'><label htmlFor={"file-" + id} className='label'>CHOOSE FILE</label></li>
                <li className='send-file'><label htmlFor={"input-" + id} className='label'>SEND</label></li>
            </ul>
        </>
    )
}

export default Peer;