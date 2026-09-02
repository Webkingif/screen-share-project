








// Connect to the local signaling server
const socket = io();

// WebRTC and Stream variables
let peerConnection;
let localStream;

// Configuration for local network WebRTC (no external STUN/TURN servers needed)
const configuration = {
    iceServers: []
};

// UI Elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusText = document.getElementById('status');
const deviceCountText = document.getElementById('device-count');
const laptopIpText = document.getElementById('laptop-ip');
const receiverUrlText = document.getElementById('receiver-url');
const resolutionSelect = document.getElementById('resolution-select');
const fpsSelect = document.getElementById('fps-select');

// Display connection info
const hostAddress = window.location.host;
laptopIpText.innerText = window.location.hostname;
receiverUrlText.innerText = `http://${hostAddress}/receiver.html`;
receiverUrlText.href = `http://${hostAddress}/receiver.html`;

// Listen for device count updates from the server
socket.on('device-count', (count) => {
    // Subtract 1 because the sender itself counts as a connected device
    const receivers = Math.max(0, count - 1);
    deviceCountText.innerText = receivers;
});

// Start Screen Sharing Flow
startBtn.addEventListener('click', async () => {
    try {
        // Read user-selected configuration
        const selectedRes = resolutionSelect.value;
        const selectedFps = parseInt(fpsSelect.value, 10);

        // Build the dynamic video constraints
        let videoConstraints = {
            frameRate: { ideal: selectedFps }
        };

        // Apply resolution constraints if not set to automatic
        if (selectedRes !== 'auto') {
            const height = parseInt(selectedRes, 10);
            const width = Math.round(height * (16 / 9));
            videoConstraints.width = { ideal: width };
            videoConstraints.height = { ideal: height };
        } else {
            videoConstraints.width = { ideal: 1920 };
            videoConstraints.height = { ideal: 1080 };
        }

        // 1. Request screen capture from the user
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: videoConstraints,
            audio: false
        });

        statusText.innerText = `Screen captured (${selectedRes === 'auto' ? 'Auto' : selectedRes + 'p'} @ ${selectedFps}fps). Establishing uplink...`;
        statusText.style.color = 'var(--neon-cyan)';

        // Update UI states
        startBtn.disabled = true;
        stopBtn.disabled = false;
        resolutionSelect.disabled = true;
        fpsSelect.disabled = true;

        // 2. Create the WebRTC Peer Connection
        peerConnection = new RTCPeerConnection(configuration);

        // 3. Add the screen capture tracks to the connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);

            // Handle user clicking "Stop sharing" on the browser's native floating bar
            track.onended = () => {
                stopScreenSharing();
            };
        });

        // 4. Handle ICE Candidates and send them to the server
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };

        // 5. Create a WebRTC Offer and send it to the signaling server
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);

        statusText.innerText = 'Transmitting. Waiting for receiver...';

    } catch (error) {
        console.error('Error capturing screen:', error);
        statusText.innerText = 'Uplink failed: Permission denied or error.';
        statusText.style.color = 'var(--neon-red)';
    }
});

// Handle incoming WebRTC Answer from the Android receiver
socket.on('answer', async (answer) => {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        statusText.innerText = 'UPLINK ACTIVE';
        statusText.style.color = '#00ff00'; // Neon green
    }
});

// Handle incoming ICE Candidates from the Android receiver
socket.on('ice-candidate', async (candidate) => {
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding received ice candidate', error);
        }
    }
});

// Stop Screen Sharing Flow
stopBtn.addEventListener('click', stopScreenSharing);

function stopScreenSharing() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Reset UI states
    statusText.innerText = 'Uplink terminated. Ready.';
    statusText.style.color = 'var(--neon-cyan)';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    resolutionSelect.disabled = false;
    fpsSelect.disabled = false;
}