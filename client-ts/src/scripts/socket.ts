import { io } from 'socket.io-client';

const URL = 'localhost:8080';

const socket = io(URL);

export default socket;