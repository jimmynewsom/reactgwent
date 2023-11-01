import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_BACKEND_URL;

console.log("creating socket (this should only show up once)")

export const socket = io(URL, {
  autoConnect: false
});