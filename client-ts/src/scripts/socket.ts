import { io } from 'socket.io-client';

const URL = '20.109.103.24:8080';

const socket = io(URL);

export default socket;