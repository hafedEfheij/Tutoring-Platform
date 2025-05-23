// Whiteboard JavaScript

// WebRTC variables
let localStream;
let remoteStream;
let peerConnection;
let roomId;
let userId;

// Recording variables
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime;
let recordings = [];

// STUN servers for WebRTC
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Whiteboard Initialized');

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }

    // Initialize whiteboard canvas
    initWhiteboard();

    // Initialize session timer
    initSessionTimer();

    // Initialize event listeners
    initEventListeners();

    // Initialize WebRTC
    initWebRTC();

    // Load recordings from localStorage
    const savedRecordings = loadRecordings();
    console.log(`Loaded ${savedRecordings.length} recordings from localStorage`);

    // Add a button to the toolbar to show recordings list
    const toolGroup = document.querySelector('.whiteboard-toolbar .tool-group:last-child');
    const recordingsBtn = document.createElement('button');
    recordingsBtn.className = 'tool-btn';
    recordingsBtn.dataset.action = 'recordings';
    recordingsBtn.innerHTML = `
        <span class="tool-icon">🎬</span>
        <span class="tool-name">Recordings</span>
    `;
    toolGroup.appendChild(recordingsBtn);

    // Add event listener to show recordings list
    recordingsBtn.addEventListener('click', () => {
        showRecordingsListModal();
    });
});

// Whiteboard variables
let canvas;
let ctx;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'pen';
let currentColor = '#000000';
let currentLineWidth = 2;
let isRemoteDrawing = false; // Flag to prevent echo when receiving drawing events

function initWhiteboard() {
    // Get canvas element
    canvas = document.getElementById('whiteboard-canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size to match parent container
    resizeCanvas();

    // Add event listeners for drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Set initial canvas background
    clearCanvas();
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - 50; // Subtract toolbar height
}

function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Send clear event to remote peer if not triggered by a received event
    if (!isRemoteDrawing) {
        sendDrawingEvent({
            type: 'clear'
        });
    }
}

function startDrawing(e) {
    if (isRemoteDrawing) return; // Prevent drawing if we're receiving remote drawing events

    isDrawing = true;

    // Get mouse position
    const pos = getMousePos(canvas, e);
    lastX = pos.x;
    lastY = pos.y;

    // For eraser, we'll draw white
    if (currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 20; // Larger for eraser
    } else {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentLineWidth;
    }

    // For text tool
    if (currentTool === 'text') {
        const text = prompt('Enter text:');
        if (text) {
            ctx.font = '16px Arial';
            ctx.fillStyle = currentColor;
            ctx.fillText(text, lastX, lastY);

            // Send text drawing event to remote peer
            sendDrawingEvent({
                type: 'text',
                text: text,
                x: lastX,
                y: lastY,
                color: currentColor
            });
        }
        isDrawing = false;
        return;
    }

    // For shape tool
    if (currentTool === 'shape') {
        const shapeType = prompt('Enter shape type (rect, circle):');
        if (shapeType === 'rect') {
            const width = parseInt(prompt('Width:')) || 100;
            const height = parseInt(prompt('Height:')) || 100;
            ctx.strokeStyle = currentColor;
            ctx.strokeRect(lastX, lastY, width, height);

            // Send rectangle drawing event to remote peer
            sendDrawingEvent({
                type: 'rect',
                x: lastX,
                y: lastY,
                width: width,
                height: height,
                color: currentColor
            });
        } else if (shapeType === 'circle') {
            const radius = parseInt(prompt('Radius:')) || 50;
            ctx.beginPath();
            ctx.arc(lastX, lastY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = currentColor;
            ctx.stroke();

            // Send circle drawing event to remote peer
            sendDrawingEvent({
                type: 'circle',
                x: lastX,
                y: lastY,
                radius: radius,
                color: currentColor
            });
        }
        isDrawing = false;
        return;
    }

    // Start a new path
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);

    // Send start drawing event to remote peer
    sendDrawingEvent({
        type: 'start',
        x: lastX,
        y: lastY,
        tool: currentTool,
        color: currentColor,
        lineWidth: ctx.lineWidth
    });
}

function draw(e) {
    if (!isDrawing || isRemoteDrawing) return;

    // Get mouse position
    const pos = getMousePos(canvas, e);

    // Draw line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // Send drawing event to remote peer
    sendDrawingEvent({
        type: 'draw',
        x: pos.x,
        y: pos.y
    });

    // Update last position
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    if (!isDrawing || isRemoteDrawing) return;

    isDrawing = false;

    // Send stop drawing event to remote peer
    sendDrawingEvent({
        type: 'stop'
    });
}

// Function to send drawing events to the remote peer
function sendDrawingEvent(data) {
    // Add session info to the data
    data.sessionId = roomId;
    data.userId = userId;

    // In a real application, this would be sent through the data channel or signaling server
    console.log('Sending drawing event:', data);

    // For demo purposes, we'll simulate sending the event
    // In a real application, you would use a data channel or signaling server
    if (peerConnection && peerConnection.connectionState === 'connected') {
        // Simulate network delay
        setTimeout(() => {
            receiveDrawingEvent(data);
        }, 50);
    }
}

// Function to handle received drawing events
function receiveDrawingEvent(data) {
    // Ignore our own events
    if (data.userId === userId) return;

    console.log('Received drawing event:', data);

    // Set flag to prevent echo
    isRemoteDrawing = true;

    switch (data.type) {
        case 'start':
            // Set drawing properties
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.lineWidth;

            // Start a new path
            ctx.beginPath();
            ctx.moveTo(data.x, data.y);
            break;

        case 'draw':
            // Draw line
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineTo(data.x, data.y);
            ctx.stroke();
            break;

        case 'stop':
            // Nothing to do
            break;

        case 'text':
            // Draw text
            ctx.font = '16px Arial';
            ctx.fillStyle = data.color;
            ctx.fillText(data.text, data.x, data.y);
            break;

        case 'rect':
            // Draw rectangle
            ctx.strokeStyle = data.color;
            ctx.strokeRect(data.x, data.y, data.width, data.height);
            break;

        case 'circle':
            // Draw circle
            ctx.beginPath();
            ctx.arc(data.x, data.y, data.radius, 0, Math.PI * 2);
            ctx.strokeStyle = data.color;
            ctx.stroke();
            break;

        case 'clear':
            // Clear canvas
            clearCanvas();
            break;
    }

    // Reset flag
    isRemoteDrawing = false;
}

function getMousePos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function saveWhiteboard() {
    // Create a temporary link
    const link = document.createElement('a');
    link.download = 'whiteboard-session.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function initSessionTimer() {
    let seconds = 0;
    let minutes = 45;
    let hours = 0;

    // Update timer every second
    setInterval(() => {
        seconds--;
        if (seconds < 0) {
            seconds = 59;
            minutes--;
            if (minutes < 0) {
                minutes = 59;
                hours--;
                if (hours < 0) {
                    // Session ended
                    hours = minutes = seconds = 0;
                }
            }
        }

        // Format time
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update timer display
        document.querySelector('.timer-value').textContent = formattedTime;
    }, 1000);
}

function initEventListeners() {
    // Tool buttons
    const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tool buttons
            toolButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Set current tool
            currentTool = button.dataset.tool;
            console.log(`Selected tool: ${currentTool}`);
        });
    });

    // Color buttons
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all color buttons
            colorButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Set current color
            currentColor = button.dataset.color;
            console.log(`Selected color: ${currentColor}`);
        });
    });

    // Action buttons
    const actionButtons = document.querySelectorAll('.tool-btn[data-action]');
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;

            if (action === 'clear') {
                if (confirm('Are you sure you want to clear the whiteboard?')) {
                    clearCanvas();
                }
            } else if (action === 'save') {
                saveWhiteboard();
            }
        });
    });

    // Session control buttons
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(button => {
        button.addEventListener('click', () => {
            const control = button.dataset.control;

            if (control === 'mic') {
                button.classList.toggle('active');
                const isMuted = button.classList.contains('active');
                button.querySelector('.control-name').textContent = isMuted ? 'Unmute' : 'Mute';

                // Toggle microphone
                if (localStream) {
                    localStream.getAudioTracks().forEach(track => {
                        track.enabled = !isMuted;
                    });
                }

                console.log(`Microphone ${isMuted ? 'muted' : 'unmuted'}`);
            } else if (control === 'camera') {
                button.classList.toggle('active');
                const isCameraOff = button.classList.contains('active');
                button.querySelector('.control-name').textContent = isCameraOff ? 'Start Video' : 'Camera';

                // Toggle camera
                if (localStream) {
                    localStream.getVideoTracks().forEach(track => {
                        track.enabled = !isCameraOff;
                    });
                }

                console.log(`Camera ${isCameraOff ? 'turned off' : 'turned on'}`);
            } else if (control === 'screen') {
                // Toggle screen sharing
                toggleScreenSharing(button);
            } else if (control === 'chat') {
                const chatPanel = document.querySelector('.chat-panel');
                chatPanel.hidden = !chatPanel.hidden;
            } else if (control === 'record') {
                toggleRecording(button);
            } else if (control === 'end') {
                if (confirm('Are you sure you want to end this session?')) {
                    // Stop recording if active
                    if (isRecording) {
                        stopRecording();
                    }

                    // Clean up WebRTC resources
                    if (localStream) {
                        localStream.getTracks().forEach(track => track.stop());
                    }

                    if (peerConnection) {
                        peerConnection.close();
                    }

                    window.location.href = 'dashboard.html';
                }
            }
        });
    });

    // Chat panel
    const closeChat = document.querySelector('.close-chat');
    if (closeChat) {
        closeChat.addEventListener('click', () => {
            document.querySelector('.chat-panel').hidden = true;
        });
    }

    const chatForm = document.querySelector('.chat-input');
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = chatForm.querySelector('input');
            const message = input.value.trim();

            if (message) {
                addChatMessage('You', message, true);
                input.value = '';
            }
        });

        const sendBtn = chatForm.querySelector('.send-btn');
        sendBtn.addEventListener('click', () => {
            const input = chatForm.querySelector('input');
            const message = input.value.trim();

            if (message) {
                addChatMessage('You', message, true);
                input.value = '';

                // Simulate tutor response after 1 second
                setTimeout(() => {
                    addChatMessage('Dr. Sarah Johnson', 'I see your point. Let me explain further on the whiteboard.', false);
                }, 1000);
            }
        });
    }
}

function addChatMessage(sender, content, isStudent) {
    const messagesContainer = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isStudent ? 'student-message' : 'tutor-message'}`;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    messageDiv.innerHTML = `
        <div class="message-sender">${sender}</div>
        <div class="message-content">${content}</div>
        <div class="message-time">${timeString}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// WebRTC Functions
async function initWebRTC() {
    // Generate a random room ID if not provided
    roomId = getParameterByName('room') || generateRandomId();
    userId = generateRandomId();

    // Update URL with room ID for sharing
    if (!getParameterByName('room')) {
        window.history.pushState({}, '', `?room=${roomId}`);
    }

    try {
        // Get local media stream
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        // Display local stream
        const localVideo = document.querySelector('.secondary-video video');
        localVideo.srcObject = localStream;
        localVideo.onloadedmetadata = () => {
            localVideo.play();
        };

        // Connect to signaling server
        connectToSignalingServer();

    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera or microphone. Please check your permissions.');
    }
}

function connectToSignalingServer() {
    // In a real application, this would connect to a WebSocket server
    // For this demo, we'll simulate the connection
    console.log('Connecting to signaling server...');

    // Simulate joining a room
    console.log(`Joined room: ${roomId}`);

    // Check if we're the first participant
    const isFirstParticipant = !getParameterByName('room');

    if (isFirstParticipant) {
        // We're the first participant, wait for others to join
        console.log('Waiting for others to join...');

        // Simulate another participant joining after 2 seconds
        setTimeout(() => {
            simulateRemoteParticipant();
        }, 2000);
    } else {
        // We're joining an existing room, initiate connection
        createPeerConnection();
        sendJoinRequest();
    }
}

function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(iceServers);

        // Add local stream tracks to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Set up event handlers for the peer connection
        peerConnection.onicecandidate = handleICECandidate;
        peerConnection.ontrack = handleTrackEvent;
        peerConnection.oniceconnectionstatechange = handleICEConnectionStateChange;

        console.log('PeerConnection created');
    } catch (error) {
        console.error('Error creating PeerConnection:', error);
        alert('Could not create WebRTC peer connection. Please try again.');
    }
}

function handleICECandidate(event) {
    if (event.candidate) {
        // In a real application, send this to the signaling server
        console.log('ICE candidate:', event.candidate);
    }
}

function handleTrackEvent(event) {
    console.log('Remote track received:', event);

    // Set remote stream
    remoteStream = event.streams[0];

    // Display remote stream
    const remoteVideo = document.querySelector('.primary-video video');
    remoteVideo.srcObject = remoteStream;
    remoteVideo.onloadedmetadata = () => {
        remoteVideo.play();
    };
}

function handleICEConnectionStateChange() {
    console.log('ICE connection state:', peerConnection.iceConnectionState);

    if (peerConnection.iceConnectionState === 'disconnected' ||
        peerConnection.iceConnectionState === 'failed' ||
        peerConnection.iceConnectionState === 'closed') {
        // Handle disconnection
        console.log('Peer disconnected');
    }
}

async function sendJoinRequest() {
    try {
        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // In a real application, send this offer to the signaling server
        console.log('Created offer:', offer);

        // Simulate receiving an answer
        setTimeout(() => {
            simulateReceiveAnswer();
        }, 1000);
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

// Helper functions
function getParameterByName(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function generateRandomId() {
    return Math.random().toString(36).substring(2, 15);
}

// Simulation functions for demo purposes
function simulateRemoteParticipant() {
    // Simulate a remote participant joining
    console.log('Remote participant joined');

    // Create a fake remote stream
    const fakeVideo = document.querySelector('.primary-video video');
    fakeVideo.src = 'https://via.placeholder.com/640x360/eee/999?text=Tutor+Video';
    fakeVideo.poster = 'https://via.placeholder.com/640x360/eee/999?text=Tutor+Video';

    // Add a welcome message in chat
    setTimeout(() => {
        addChatMessage('Dr. Sarah Johnson', 'Hello! Welcome to our tutoring session. How can I help you today?', false);
    }, 1000);
}

function simulateReceiveAnswer() {
    // Simulate receiving an answer from the remote peer
    const fakeAnswer = {
        type: 'answer',
        sdp: 'v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:fake\r\na=ice-pwd:fake\r\na=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99\r\na=setup:active\r\na=mid:0\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:96 VP8/90000\r\na=ssrc:1234567890 cname:fake\r\n'
    };

    // Set remote description
    peerConnection.setRemoteDescription(new RTCSessionDescription(fakeAnswer))
        .then(() => {
            console.log('Remote description set');

            // Simulate receiving ICE candidates
            simulateReceiveICECandidates();
        })
        .catch(error => {
            console.error('Error setting remote description:', error);
        });
}

function simulateReceiveICECandidates() {
    // Simulate receiving ICE candidates from the remote peer
    const fakeCandidate = {
        candidate: 'candidate:1 1 UDP 2122252543 192.168.1.100 30000 typ host',
        sdpMid: '0',
        sdpMLineIndex: 0
    };

    // Add ICE candidate
    peerConnection.addIceCandidate(new RTCIceCandidate(fakeCandidate))
        .then(() => {
            console.log('ICE candidate added');

            // Simulate connected state
            simulateConnectedState();
        })
        .catch(error => {
            console.error('Error adding ICE candidate:', error);
        });
}

function simulateConnectedState() {
    // Simulate connected state
    console.log('Connection established');

    // Simulate a remote stream
    const fakeVideo = document.querySelector('.primary-video video');
    fakeVideo.src = 'https://via.placeholder.com/640x360/eee/999?text=Tutor+Video';
    fakeVideo.poster = 'https://via.placeholder.com/640x360/eee/999?text=Tutor+Video';

    // Add a welcome message in chat
    setTimeout(() => {
        addChatMessage('Dr. Sarah Johnson', 'Hello! Welcome to our tutoring session. How can I help you today?', false);
    }, 1000);
}

// Screen sharing functionality
async function toggleScreenSharing(button) {
    try {
        // Check if we're already sharing screen
        const isSharing = button.classList.contains('active');

        if (isSharing) {
            // Stop screen sharing
            button.classList.remove('active');
            button.querySelector('.control-name').textContent = 'Share';

            // Restore camera video track
            if (localStream) {
                // Stop all current video tracks
                localStream.getVideoTracks().forEach(track => track.stop());

                // Get new camera stream
                const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });

                // Replace video track in local stream
                const videoTrack = cameraStream.getVideoTracks()[0];
                const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }

                // Update local stream
                localStream.removeTrack(localStream.getVideoTracks()[0]);
                localStream.addTrack(videoTrack);

                // Update local video
                const localVideo = document.querySelector('.secondary-video video');
                localVideo.srcObject = localStream;
            }

            console.log('Screen sharing stopped');
        } else {
            // Start screen sharing
            try {
                // Get screen sharing stream
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'always'
                    },
                    audio: false
                });

                // Add screen sharing track to peer connection
                const videoTrack = screenStream.getVideoTracks()[0];

                // Replace video track in peer connection
                const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }

                // Update local stream
                if (localStream) {
                    localStream.removeTrack(localStream.getVideoTracks()[0]);
                    localStream.addTrack(videoTrack);

                    // Update local video
                    const localVideo = document.querySelector('.secondary-video video');
                    localVideo.srcObject = localStream;
                }

                // Handle track ending (user stops sharing)
                videoTrack.onended = async () => {
                    button.classList.remove('active');
                    button.querySelector('.control-name').textContent = 'Share';

                    // Restore camera video track
                    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const cameraTrack = cameraStream.getVideoTracks()[0];

                    // Replace video track in peer connection
                    const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(cameraTrack);
                    }

                    // Update local stream
                    localStream.removeTrack(localStream.getVideoTracks()[0]);
                    localStream.addTrack(cameraTrack);

                    // Update local video
                    const localVideo = document.querySelector('.secondary-video video');
                    localVideo.srcObject = localStream;

                    console.log('Screen sharing stopped');
                };

                // Update button state
                button.classList.add('active');
                button.querySelector('.control-name').textContent = 'Stop Sharing';

                console.log('Screen sharing started');
            } catch (error) {
                console.error('Error starting screen sharing:', error);
                if (error.name === 'NotAllowedError') {
                    alert('Screen sharing permission denied. Please try again and allow access.');
                } else {
                    alert('Could not start screen sharing. Please try again.');
                }
            }
        }
    } catch (error) {
        console.error('Error toggling screen sharing:', error);
        alert('An error occurred while toggling screen sharing. Please try again.');
    }
}

// Toggle recording
async function toggleRecording(button) {
    try {
        if (!isRecording) {
            // Start recording
            startRecording(button);
        } else {
            // Stop recording
            stopRecording(button);
        }
    } catch (error) {
        console.error('Error toggling recording:', error);
        alert('An error occurred while toggling recording. Please try again.');
    }
}

// Start recording
async function startRecording(button) {
    try {
        // Create a combined stream with video and whiteboard
        const videoElement = document.querySelector('.primary-video video');
        const canvasElement = document.getElementById('whiteboard-canvas');

        // Create a new canvas for combined recording
        const recordingCanvas = document.createElement('canvas');
        recordingCanvas.width = 1280;
        recordingCanvas.height = 720;
        const ctx = recordingCanvas.getContext('2d');

        // Create a stream from the recording canvas
        const recordingStream = recordingCanvas.captureStream(30); // 30 FPS

        // Add audio track from local stream if available
        if (localStream && localStream.getAudioTracks().length > 0) {
            recordingStream.addTrack(localStream.getAudioTracks()[0]);
        }

        // Set up MediaRecorder
        mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 3000000 // 3 Mbps
        });

        // Clear recorded chunks
        recordedChunks = [];

        // Handle data available event
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // Handle recording stop event
        mediaRecorder.onstop = () => {
            // Create a blob from the recorded chunks
            const blob = new Blob(recordedChunks, { type: 'video/webm' });

            // Calculate recording duration
            const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Create a recording object
            const recording = {
                id: Date.now().toString(),
                title: document.querySelector('.session-title').textContent,
                date: new Date().toLocaleDateString(),
                duration: durationText,
                blob: blob,
                url: URL.createObjectURL(blob)
            };

            // Add recording to the list
            recordings.push(recording);

            // Save recordings to localStorage (just the metadata, not the blob)
            saveRecordings();

            // Show recording modal
            showRecordingModal(recording);
        };

        // Start recording
        mediaRecorder.start(1000); // Capture in 1-second chunks
        recordingStartTime = Date.now();
        isRecording = true;

        // Update button state
        button.classList.add('active');
        button.querySelector('.control-name').textContent = 'Stop Recording';

        // Start the drawing loop for combined recording
        drawRecordingFrame(ctx, videoElement, canvasElement);

        console.log('Recording started');
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Could not start recording. Please try again.');
    }
}

// Stop recording
function stopRecording(button) {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;

        // Update button state
        if (button) {
            button.classList.remove('active');
            button.querySelector('.control-name').textContent = 'Record';
        }

        console.log('Recording stopped');
    }
}

// Draw frames for recording
function drawRecordingFrame(ctx, videoElement, canvasElement) {
    if (!isRecording) return;

    // Clear the canvas
    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw video (left side)
    if (videoElement.srcObject) {
        ctx.drawImage(
            videoElement,
            0, 0, ctx.canvas.width / 2, ctx.canvas.height
        );
    }

    // Draw whiteboard (right side)
    ctx.drawImage(
        canvasElement,
        ctx.canvas.width / 2, 0, ctx.canvas.width / 2, ctx.canvas.height
    );

    // Draw session info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, 40);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(
        document.querySelector('.session-title').textContent,
        10, 25
    );

    ctx.fillText(
        document.querySelector('.timer-value').textContent,
        ctx.canvas.width - 100, 25
    );

    // Continue drawing frames
    requestAnimationFrame(() => drawRecordingFrame(ctx, videoElement, canvasElement));
}

// Show recording modal
function showRecordingModal(recording) {
    const modal = document.querySelector('.recording-modal');
    const player = document.getElementById('recording-player');
    const title = document.getElementById('recording-title');
    const date = document.getElementById('recording-date');
    const duration = document.getElementById('recording-duration');
    const downloadBtn = document.getElementById('download-recording');

    // Set recording details
    player.src = recording.url;
    title.textContent = recording.title;
    date.textContent = `Recorded on ${recording.date}`;
    duration.textContent = `Duration: ${recording.duration}`;

    // Set download button action
    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = recording.url;
        a.download = `${recording.title.replace(/\s+/g, '-')}-${recording.id}.webm`;
        a.click();
    };

    // Set share button action
    const shareBtn = document.getElementById('share-recording');
    shareBtn.onclick = () => {
        if (navigator.share) {
            navigator.share({
                title: recording.title,
                text: `Check out my recorded tutoring session: ${recording.title}`,
                url: window.location.href
            }).catch(error => {
                console.error('Error sharing recording:', error);
                alert('Could not share recording. Please try again.');
            });
        } else {
            alert('Web Share API not supported in your browser. You can download the recording and share it manually.');
        }
    };

    // Show modal
    modal.hidden = false;

    // Add close button event listener
    const closeBtn = document.querySelector('.close-recording-modal');
    closeBtn.onclick = () => {
        modal.hidden = true;
        player.pause();
    };
}

// Save recordings metadata to localStorage
function saveRecordings() {
    const recordingsData = recordings.map(recording => {
        // Create a new object without the blob and URL
        return {
            id: recording.id,
            title: recording.title,
            date: recording.date,
            duration: recording.duration
        };
    });

    localStorage.setItem('recordings', JSON.stringify(recordingsData));
}

// Load recordings metadata from localStorage
function loadRecordings() {
    const recordingsData = JSON.parse(localStorage.getItem('recordings') || '[]');

    // We can't restore the actual recordings (blobs) from localStorage
    // This is just for showing the list of past recordings
    return recordingsData;
}

// Show recordings list modal
function showRecordingsListModal() {
    const modal = document.querySelector('.recordings-list-modal');
    const recordingsList = document.querySelector('.recordings-list');

    // Clear existing items
    recordingsList.innerHTML = '';

    // Load recordings from localStorage
    const savedRecordings = loadRecordings();

    if (savedRecordings.length === 0) {
        recordingsList.innerHTML = '<p>No recordings found.</p>';
    } else {
        // Add recordings to the list
        savedRecordings.forEach(recording => {
            const item = document.createElement('div');
            item.className = 'recording-item';
            item.innerHTML = `
                <div class="recording-item-thumbnail">
                    <img src="https://via.placeholder.com/120x68/eee/999?text=Recording" alt="Recording Thumbnail">
                </div>
                <div class="recording-item-details">
                    <div class="recording-item-title">${recording.title}</div>
                    <div class="recording-item-info">
                        <span>${recording.date}</span>
                        <span>${recording.duration}</span>
                    </div>
                    <div class="recording-item-actions">
                        <button class="secondary-btn">View Details</button>
                    </div>
                </div>
            `;

            // Add click event to view details button
            const viewBtn = item.querySelector('.secondary-btn');
            viewBtn.onclick = () => {
                // We can't actually play the recording from localStorage
                // In a real app, you would fetch the recording from the server
                alert('In a real application, this would load the recording from the server.');
            };

            recordingsList.appendChild(item);
        });
    }

    // Show modal
    modal.hidden = false;

    // Add close button event listener
    const closeBtn = document.querySelector('.close-recordings-list-modal');
    closeBtn.onclick = () => {
        modal.hidden = true;
    };
}