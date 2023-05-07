import { io } from 'socket.io-client';

const URL = 'wormhold.azurewebsites.net:80';

const socket = io(URL);

export default socket;