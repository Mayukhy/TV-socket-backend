const WebSocket = require("ws");

// Configure the WebSocket server to listen on all network interfaces
const server = new WebSocket.Server({ port: 8080 });

let tvSocket = null; // Stores the TV connection
let remoteSocket = null; // Stores the Remote connection

server.on("connection", (socket) => {
  console.log("A client connected.");

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      // Handle registration of TV or Remote
      if (data.type === "register") {
        if (data.role === "tv") {
          tvSocket = socket;
          console.log("TV registered.");
        } else if (data.role === "remote") {
          remoteSocket = socket;
          console.log("Remote registered.");
        }
      }

      // Handle remote commands
      if (data.type === "command" && tvSocket) {
        tvSocket.send(JSON.stringify(data)); // Forward the command to the TV
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  socket.on("close", () => {
    if (socket === tvSocket) {
      console.log("TV disconnected.");
      tvSocket = null;
    } else if (socket === remoteSocket) {
      console.log("Remote disconnected.");
      remoteSocket = null;
    }
  });
});

console.log("WebSocket server is running on ws://0.0.0.0:8080");

// Display the server's local IP address for easy access from remote devices
const os = require("os");
const networkInterfaces = os.networkInterfaces();
Object.values(networkInterfaces).forEach((interfaces) => {
  interfaces.forEach((iface) => {
    if (iface.family === "IPv4" && !iface.internal) {
      console.log(`Access the server at ws://${iface.address}:8080`);
    }
  });
});
