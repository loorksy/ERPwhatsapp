import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socketInstance;

const deriveSocketUrl = () => {
  if (SOCKET_URL) return SOCKET_URL;

  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    // Fallback to stripping trailing /api if the env is not a full URL
    return API_BASE_URL.replace(/\/?api$/, '');
  }
};

export const getSocket = (token) => {
  if (!socketInstance) {
    socketInstance = io(deriveSocketUrl(), {
      transports: ['websocket'],
      autoConnect: false,
      auth: token ? { token } : undefined,
    });
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};

export const closeSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
};

export default getSocket;
