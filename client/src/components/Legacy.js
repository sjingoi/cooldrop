import React, { Component } from 'react';

class Legacy extends Component {
    render() {
        return(
            <div>
                <p>Connection Type</p>
                <div>
                    <p>This is the _____ connection</p>
                    <select id="connection-type">
                        <option value="local">local</option>
                        <option value="remote">remote</option>
                    </select>
                    <button id="submit-type">Submit</button>
                </div>
                <p>Local Offer</p>
                <div>
                    <textarea id="local-offer" disabled="true"></textarea>
                    <button id="submit-local" disabled="true">Submit</button>
                </div>

                <p>Remote Offer</p>
                <div>
                    <textarea id="remote-offer" disabled="true"></textarea>
                    <button id="submit-remote" disabled="true">Submit</button>    
                </div>
                
                <p>ChatArea</p>
                <div>
                    <textarea id="chat-box-recieve" disabled="true"></textarea>
                    <textarea id="chat-box-send" disabled="true"></textarea>
                    <button id="submit-text">Submit</button>
                    <p style={{color: "green"}} id="connection-open-msg"></p> 
                </div>

                <p>File Transfer</p>
                <div>
                    <input type="file" id="fileInput"></input>
                    <button id="send-file">Send</button>
                    <br></br>
                    <progress id="file-progress" value="0"></progress>
                </div>
            </div>
        )
    }
}

export default Legacy;