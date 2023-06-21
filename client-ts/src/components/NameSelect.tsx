import './nameselect.css'
import React, { useState } from 'react';

function NameSelect() {

    const [text, setText] = useState('');
    //const [expanded, setExpanded] = useState(false);

    const handleChange = (event: any) => {
        setText(event.target.value);
    };

    return (
        <div style={{display: 'flex', flexDirection: 'row', width: "100%", height: "100vh"}}>
            <div className="nameselect">
                <p className='welcome'>Welcome to CoolDrop.</p>
                <p className='enter-name'>To get started, please specify a name for your device:</p>
                <input type='text' className='name-input' value={text} onChange={handleChange} style={{ }}></input>
                <hr style={{width: "10rem"}}></hr>
                <button type='button' title="Hello" className='submit-name'></button>
            </div>

        </div>
        
    );
}
export default NameSelect;