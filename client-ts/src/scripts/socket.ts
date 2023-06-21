import { io } from 'socket.io-client';

const URL = 'cooldrop.cc';
//const URL = '192.168.0.60:80';

const socket = io(URL);

export default socket;
