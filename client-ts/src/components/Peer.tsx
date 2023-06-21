//import React from 'react';
import PeerConnection from '../scripts/peer-connection';
import { useState, useRef } from 'react';
import './peer.css'
import computerIcon from '../public/computer-svgrepo-com.svg'

interface Props {
    peer: PeerConnection
    name: string,
    id: String
}

function Peer (props: Props) {
    const [progress, setProgress] = useState(0);
    const fileBoxRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLLabelElement>(null);

    let peer = props.peer;
    let id = props.id;
    

    //console.log("peer id: " + peer.get_remote_id());
    //console.log(props)

    peer.on_progess = (value => setProgress(value));

    function handleSendFile(files: FileList | null) {
        console.log("Sending file to peer id: " + peer.get_remote_id());
        if (fileBoxRef.current === null || fileBoxRef.current.files === null) {
            console.log("file box is null")
            return
        }
        console.log("Sending file to peer id: " + peer.get_remote_id());
        console.log(files);
        if (files && files[0]) {peer.send_file(files[0])}
    }

    const onDragEnter = () => {
        wrapperRef.current?.classList.add('dragover')
        console.log("drag enter")
    };

    const onDragLeave = () => {
        wrapperRef.current?.classList.remove('dragover')
        console.log("drag leave")
    };

    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        wrapperRef.current?.classList.remove('dragover')
        handleSendFile(e.dataTransfer.files)
        //console.log(e.dataTransfer.files[0])
    };

    return (
        <div className='peer'>
            <p className='name'>{props.name}</p>
            <img src={computerIcon} className='icon'></img>
            <p className='uuid'>{peer.get_remote_id()}</p>
            <progress value={progress} className='progress'></progress>
            <label htmlFor={"file-" + id} className='input-file' ref={wrapperRef} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDrop={e => onDrop(e)} onDragOver={(event) => event.preventDefault()}>SEND FILE</label>
            <input type="file" ref={fileBoxRef} id={"file-" + id} onChange={() => {if (fileBoxRef.current) handleSendFile(fileBoxRef.current.files)}} multiple></input>
        </div>
    )
}

export default Peer;

// {/* <button onClick={handleSendFile} id={"input-" + id}></button> */}
//             {/* <li className='input-file'><label htmlFor={"file-" + id} className='label'>CHOOSE FILE</label></li> */}
//             {/* <ul className='buttons'>
                
//                 <li className='send-file'><label htmlFor={"input-" + id} className='label'>SEND</label></li>
//             </ul> */}