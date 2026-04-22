import { io } from "socket.io-client";

// Connects to same origin in prod, proxied through Vite in dev
const socket = io({ autoConnect: true });

export default socket;
