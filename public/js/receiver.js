


// Connect to the local signaling server[span_1](start_span)[span_1](end_span)
const socket = io();

// WebRTC variables
let peerConnection;

// Configuration for local network WebRTC (no external STUN/TURN servers needed)[span_2](start_span)[span_2](end_span)
const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

// UI Elements
const statusText = document.getElementById('status');
const remoteVideo = document.getElementById('remote-video');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const disconnectBtn = document.getElementById('disconnect-btn');

// Initialize Peer Connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Listen for incoming video tracks from the laptop[span_3](start_span)[span_3](end_span)
    peerConnection.ontrack = (event) => {
        // Assign the incoming stream to the video element[span_4](start_span)[span_4](end_span)
        remoteVideo.srcObject = event.streams[0];

        statusText.innerText = 'UPLINK ACTIVE. RECEIVING TRANSMISSION...';
        statusText.style.color = '#00ff00'; // Neon green for active status
    };

    // Send ICE candidates to the sender[span_5](start_span)[span_5](end_span)
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', event.candidate);
        }
    };

    // Handle connection state drops (e.g., if the laptop sender is closed)
    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
            handleDisconnect();
        }
    };
}

// Handle incoming WebRTC Offer from the Windows sender[span_6](start_span)[span_6](end_span)
socket.on('offer', async (offer) => {
    // If a connection doesn't exist yet, create one
    if (!peerConnection) {
        createPeerConnection();
    }

    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        // Create a WebRTC Answer[span_7](start_span)[span_7](end_span)
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send the Answer back through the signaling server[span_8](start_span)[span_8](end_span)
        socket.emit('answer', answer);

        statusText.innerText = 'Negotiating connection...';
    } catch (error) {
        console.error('Error handling offer:', error);
        statusText.innerText = 'Uplink failed: Negotiation error.';
        statusText.style.color = 'var(--neon-red)';
    }
});

// Handle incoming ICE Candidates from the Windows sender[span_9](start_span)[span_9](end_span)
socket.on('ice-candidate', async (candidate) => {
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding received ice candidate:', error);
        }
    }
});

// Full screen functionality for the Android browser[span_10](start_span)[span_10](end_span)
fullscreenBtn.addEventListener('click', () => {
    if (remoteVideo.requestFullscreen) {
        remoteVideo.requestFullscreen();
    } else if (remoteVideo.webkitRequestFullscreen) { /* Safari/Older Android support */
        remoteVideo.webkitRequestFullscreen();
    }
});

// Disconnect functionality[span_11](start_span)[span_11](end_span)
disconnectBtn.addEventListener('click', handleDisconnect);

function handleDisconnect() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Clear the video element
    remoteVideo.srcObject = null;

    // Reset UI
    statusText.innerText = 'Uplink terminated. Waiting for new connection...';
    statusText.style.color = 'var(--neon-cyan)';
}

