import { io } from 'socket.io-client';

const URL = 'cooldrop.cc';

const socket = io(URL);

export default socket;
