import { io } from 'socket.io-client';

const URL = 'https://hello-world-2-386020.uk.r.appspot.com/';

const socket = io(URL);

export default socket;