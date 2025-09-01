//const URL = 'http://10.132.135.53:4000';
//const URL = 'http://localhost:4000';
//const URL = 'https://bmm-manager.onrender.com';
const URL = 'https://bmm-manager.fly.dev';
//console.log('API URL:', URL);

const API_BASE_URL = URL;
const SOCKET_BASE_URL = URL;

export { API_BASE_URL, SOCKET_BASE_URL };

export function createSocket() {
    return io(SOCKET_BASE_URL, {
        transports: ['polling', 'websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });
}