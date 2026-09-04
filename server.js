import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";


//__dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Starting the HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

//Serve the sender and receiver webpages from the public/ folder
app.use(express.static(path.join(__dirname, "public")));

// Track connected devices
let connectedDevices = 0;
let currentPin = null;
let hostSocketId = null;

// Handle websocket connections

io.on("connection", (socket) => {
    connectedDevices++;
    console.log(`A user connected: ${socket.id}. Total devices: ${connectedDevices}`);

    //Broadcast connection status
    io.emit("device-count", connectedDevices);

    //  forward WebRTC Offer
    socket.on("offer", (offer) => {
        socket.broadcast.emit("offer", offer);
    })

    // forward WebRTC Answer
    socket.on("answer", (answer) => {
        socket.broadcast.emit("answer", answer);
    })

    //forward Ice candidates
    socket.on("ice-candidate", (candidate) => {
        socket.broadcast.emit("ice-candidate", candidate);
    })

    //Handle disconnections
    socket.on("disconnect", () => {
        connectedDevices--;
        console.log(`User disconnected: ${socket.id}. Total devices: ${connectedDevices}`);
        io.emit("device-count", connectedDevices);
    });

    socket.on("clipboard-text", (text) => {
        socket.broadcast.emit("clipboard-text", text);
    })

    // --- PIN Verification Logic ---


    // 1. Laptop registers its PIN
    socket.on('register-host', (pin) => {
        currentPin = pin;
        hostSocketId = socket.id;
        console.log(`Host registered with PIN: ${pin}`);
    });

    // 2. Phone submits a PIN for verification
    socket.on('verify-pin', (pin) => {
        if (pin === currentPin && hostSocketId) {
            // PIN is correct, ask laptop for approval
            io.to(hostSocketId).emit('connection-request', socket.id);
        } else {
            // PIN is incorrect
            socket.emit('pin-rejected');
        }
    });

    // 3. Laptop responds with Allow or Deny
    socket.on('host-response', (data) => {
        if (data.approved) {
            io.to(data.requesterId).emit('pairing-approved');
        } else {
            io.to(data.requesterId).emit('pairing-denied');
        }
    });
});



// The server will listen on a local network port 
const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log("Signaling server running");
    console.log(`Local Testing: http://localhost:${PORT}`);
})



