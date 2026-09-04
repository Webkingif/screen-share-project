


// Connect to the local signaling server
const socket = io();

// WebRTC variables
let peerConnection;

// Configuration for local network WebRTC (no external STUN/TURN servers needed)
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
        remoteVideo.play().catch(error => {
            console.error("Mobile browser prevented autoplay", error);
            statusText.innerText = "TAP TO PLAY VIDEO";
            statusText.style.color = "var(--neon-red)";
        })
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






// Clipboard Transfer Logic
const clipboardInput = document.getElementById('clipboard-input');
const sendTextBtn = document.getElementById('send-text-btn');
const receivedText = document.getElementById('received-text');
const copyBtn = document.getElementById('copy-btn'); // New Copy Button

// Send text to the other device
sendTextBtn.addEventListener('click', () => {
    const text = clipboardInput.value;
    if (text.trim() !== "") {
        socket.emit('clipboard-text', text);
        clipboardInput.value = ''; // Clear after sending
    }
});

// Receive text from the other device
socket.on('clipboard-text', (text) => {
    receivedText.innerText = text;
    receivedText.style.color = '#00ff00'; // Flash neon green when received

    // Show the copy button now that we have data
    copyBtn.style.display = 'inline-block';
    copyBtn.innerText = 'COPY';
});

// Copy incoming text to the device's local clipboard
copyBtn.addEventListener('click', async () => {
    try {
        const textToCopy = receivedText.innerText;
        await navigator.clipboard.writeText(textToCopy);

        // Provide visual feedback
        copyBtn.innerText = 'COPIED!';
        copyBtn.style.color = '#00ff00';
        copyBtn.style.borderColor = '#00ff00';

        // Reset button style after 2 seconds
        setTimeout(() => {
            copyBtn.innerText = 'COPY';
            copyBtn.style.color = 'var(--neon-cyan)';
            copyBtn.style.borderColor = 'var(--neon-cyan)';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        copyBtn.innerText = 'ERROR';
    }
});








const pinPanel = document.getElementById('pin-panel');
const streamContainer = document.getElementById('stream-container');
const pinInput = document.getElementById('pin-input');
const submitPinBtn = document.getElementById('submit-pin-btn');
const pinFeedback = document.getElementById('pin-feedback');

// Send PIN to server for verification
submitPinBtn.addEventListener('click', () => {
    const enteredPin = pinInput.value.trim();
    if (enteredPin.length > 0) {
        socket.emit('verify-pin', enteredPin);
        pinFeedback.style.display = 'none';
        submitPinBtn.innerText = 'VERIFYING...';
        submitPinBtn.disabled = true;
    }
});

// Server rejects the PIN
socket.on('pin-rejected', () => {
    pinFeedback.innerText = 'Invalid PIN. Try again.';
    pinFeedback.style.display = 'block';
    submitPinBtn.innerText = 'SUBMIT';
    submitPinBtn.disabled = false;
});

// Laptop user clicked "Deny"
socket.on('pairing-denied', () => {
    pinFeedback.innerText = 'Connection denied by host.';
    pinFeedback.style.color = 'var(--neon-red)';
    pinFeedback.style.display = 'block';
    submitPinBtn.innerText = 'SUBMIT';
    submitPinBtn.disabled = false;
});

// Laptop user clicked "Allow"
socket.on('pairing-approved', () => {
    // Hide the login screen and show the video player interface
    pinPanel.style.display = 'none';
    streamContainer.style.display = 'block';

    // The laptop will now automatically send the WebRTC offer to start the video
});





