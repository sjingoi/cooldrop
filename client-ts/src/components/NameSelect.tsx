import './nameselect.css'
import React, { useState } from 'react';

interface Props {
    updateName: any;
}

function NameSelect(props: Props) {

    const submitBtnRef = React.useRef<HTMLLabelElement>(null);
    const [text, setText] = useState('');
    //const [expanded, setExpanded] = useState(false);

    console.log(text.length)

    if (text.length >= 1) {
        submitBtnRef.current?.classList.add('enabled');
    } else {
        submitBtnRef.current?.classList.remove('enabled');
    }

    const handleChange = (event: any) => {
        setText(event.target.value);
    };

    const submitName = () => {
        if (text.length >= 1) {
            localStorage.setItem("name", text);
            props.updateName(text);
        }
    }

    return (
        <div style={{display: 'flex', flexDirection: 'row', width: "100%", height: "90%"}}>
            <div className="nameselect">
                <p className='welcome'>Welcome to CoolDrop.</p>
                <p className='enter-name'>To get started, please specify a name that will help others identify your device:</p>
                <input type='text' className='name-input' value={text} onChange={handleChange} style={{ }}></input>
                <hr style={{width: "10rem"}}></hr>
                <button className='submit-button' id='submit-name-btn' ></button>
                <label ref={submitBtnRef} className='submit-label' onClick={submitName}>Submit</label>
            </div>
        </div>
        
    );
}
export default NameSelect;