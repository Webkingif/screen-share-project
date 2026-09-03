Local Wi-Fi Screen Sharing

«A local network screen-sharing application that allows a Windows laptop to share its screen in real time with an Android phone using WebRTC.»

"Node.js" (https://img.shields.io/badge/Node.js-v18+-green)
"WebRTC" (https://img.shields.io/badge/WebRTC-Supported-blue)
"Status" (https://img.shields.io/badge/status-active-success)

---

📖 Table of Contents

* "About the Project" (#about-the-project)
* "Features" (#features)
* "Built With" (#built-with)
* "Project Structure" (#project-structure)
* "Getting Started" (#getting-started)
* "Usage" (#usage)
* "Troubleshooting" (#troubleshooting)
* "Roadmap" (#roadmap)

---

About the Project

This project is a lightweight, low-latency screen-sharing system designed to work entirely within a local Wi-Fi network. It allows a user to view their Windows laptop screen directly on an Android phone.

Because it relies on a locally hosted signaling server to establish a direct peer-to-peer WebRTC connection, it does not require internet access, cloud servers, or external streaming services once installed. The primary goal is to provide a fast, private, and offline-capable way to monitor a desktop screen from a mobile device.

---

✨ Features

* Real-Time WebRTC Streaming: Provides low-latency, direct local network communication with minimal buffering.
* No Internet Required: Operates 100% locally on your Wi-Fi network without routing traffic through public IP addresses or port forwarding.
* Configurable Video Quality: Allows the user to select video resolution (e.g., 480p, 720p, 1080p) and frame rates (10, 15, or 30 FPS) to balance bandwidth and CPU usage.
* Bidirectional Clipboard Transfer: Instantly send, receive, and copy text or links back and forth between the Windows laptop and the Android phone over the WebSocket connection.
* Cross-Platform Browser Support: Initially implemented as a web-based prototype utilizing browser screen capture APIs and mobile-friendly web receivers.
* Responsive Mobile Receiver: Features full-screen mode and automatic stream rendering for Android browsers.

---

🛠️ Built With

This project's Phase 1 web-based prototype utilizes the following technologies:

Frontend

* HTML5 / CSS3 (Futuristic Dark Theme)
* JavaScript (ES6 Modules)
* WebRTC (RTCPeerConnection)
* Screen Capture API ("navigator.mediaDevices.getDisplayMedia")

Backend (Signaling Server)

* Node.js
* Express.js
* Socket.IO (for WebSocket signaling)

---

📁 Project Structure

screen-share-project/
├── public/
│ ├── index.html
│ ├── sender.html
│ ├── receiver.html
│ │
│ ├── css/
│ │ └── style.css
│ │
│ └── js/
│ ├── sender.js
│ └── receiver.js
│
├── package.json
└── server.js

---

🚀 Getting Started

Follow these instructions to set up the Phase 1 web-based prototype on your local machine.

Prerequisites

* Node.js: Must be installed on your Windows laptop.
* Network: Both the Windows laptop and the Android phone must be connected to the exact same Wi-Fi network.

Installation

1. Clone or download this repository to your Windows laptop.
2. Open a terminal in the root directory ("screen-share-project/").
3. Run "npm install" to install the Express and Socket.IO dependencies.

Running the Project

1. Start the local signaling server by running "node server.js" in your terminal.
2. The terminal will output the local network port (e.g., "3000").

---

💻 Usage

1. Start the Sender: On your Windows laptop, open Chrome or Edge and navigate to "http://localhost:3000/sender.html".
2. Configure Settings: Select your desired resolution and frame rate (Recommended default: 720p at 15 FPS).
3. Connect the Receiver: Find your laptop's local IPv4 address (e.g., "192.168.1.100") and enter "http://<LAPTOP_IP>:3000/receiver.html" into your Android phone's Chrome browser.
4. Initiate Uplink: Click "Start Screen Sharing" on the laptop dashboard and select the screen, window, or tab you wish to share.
5. View: The laptop screen will appear on the Android device in real time.
6. Share Text: Use the "Clipboard Transfer" panel on either device to type or paste text and send it directly to the other screen.

---

⚠️ Troubleshooting

Windows Firewall

Windows Firewall may block incoming connections to your Node server. You must configure your firewall to allow Node.js and the selected server port (e.g., 3000) for local network connections.

HTTPS / Secure Context Restrictions

Browsers often restrict access to the "getDisplayMedia()" API over standard HTTP. For the Windows laptop sender, you must access the sender page via "http://localhost" (or configure HTTPS), as "localhost" receives special treatment as a trusted development context.

---

🗺️ Roadmap

Future features planned for this project include:

* Native Android App: Transitioning the mobile web receiver to a native Kotlin Android application using a native WebRTC library to bypass mobile browser restrictions.
* Remote Control: Adding mouse, keyboard, and touch input control from the Android phone.
* Enhanced Security: Implementing connection PINs, QR code pairing, and one-time pairing codes to disconnect unknown devices.
* Audio Streaming: Supporting audio capture alongside the video feed.
* Media Management: Adding screenshot capture and screen recording functionalities.