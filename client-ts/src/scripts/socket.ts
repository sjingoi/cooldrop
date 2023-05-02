import { io } from 'socket.io-client';

const URL = '99.231.155.162:7016';

const socket = io(URL);

export default socket;