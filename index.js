const http = require('http');
const WebSocket = require('ws');

// Use environment variables for flexibility (Render provides `PORT`)
const PORT = process.env.PORT || 8080;

// Create an HTTP server (required for Render's health checks)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

// Attach WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

let tvSocket = null; // Stores the TV connection
let remoteSocket = null; // Stores the Remote connection

// Broadcast to all connected clients except the sender
const broadcast = (data, excludeSocket = null) => {
    wss.clients.forEach((client) => {
        if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

wss.on('connection', (socket) => {
    console.log('A client connected.');

    socket.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received:', data);

        // Handle registration of TV or Remote
        if (data.type === 'register') {
            if (data.role === 'tv') {
                tvSocket = socket;
                console.log('TV registered.');
            } else if (data.role === 'remote') {
                remoteSocket = socket;
                console.log('Remote registered.');
            }
        }

        // Handle remote commands and forward them to the TV
        if (data.type === 'command' && tvSocket) {
            tvSocket.send(JSON.stringify(data)); // Forward the command to the TV
        }

        // Handle refresh events and broadcast to all clients
        if (data.type === 'refresh') {
            console.log('Broadcasting refresh to all clients.');
            broadcast({ type: 'refresh', state: data.state }, socket);
        }
    });

    socket.on('close', () => {
        if (socket === tvSocket) {
            console.log('TV disconnected.');
            tvSocket = null;
        } else if (socket === remoteSocket) {
            console.log('Remote disconnected.');
            remoteSocket = null;
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});
