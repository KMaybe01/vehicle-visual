import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3100';

export const socket = io(`${SOCKET_URL}/vehicle`, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
});
