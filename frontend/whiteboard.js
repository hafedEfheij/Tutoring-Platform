// Whiteboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Whiteboard Initialized');
    
    // Initialize whiteboard canvas
    initWhiteboard();
    
    // Initialize session timer
    initSessionTimer();
    
    // Initialize event listeners
    initEventListeners();
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
}

function startDrawing(e) {
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
        } else if (shapeType === 'circle') {
            const radius = parseInt(prompt('Radius:')) || 50;
            ctx.beginPath();
            ctx.arc(lastX, lastY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = currentColor;
            ctx.stroke();
        }
        isDrawing = false;
        return;
    }
    
    // Start a new path
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

function draw(e) {
    if (!isDrawing) return;
    
    // Get mouse position
    const pos = getMousePos(canvas, e);
    
    // Draw line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    // Update last position
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    isDrawing = false;
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
                console.log(`Microphone ${isMuted ? 'muted' : 'unmuted'}`);
            } else if (control === 'camera') {
                button.classList.toggle('active');
                const isCameraOff = button.classList.contains('active');
                button.querySelector('.control-name').textContent = isCameraOff ? 'Start Video' : 'Camera';
                console.log(`Camera ${isCameraOff ? 'turned off' : 'turned on'}`);
            } else if (control === 'screen') {
                console.log('Screen sharing toggled');
                alert('Screen sharing would be implemented with WebRTC');
            } else if (control === 'chat') {
                const chatPanel = document.querySelector('.chat-panel');
                chatPanel.hidden = !chatPanel.hidden;
            } else if (control === 'end') {
                if (confirm('Are you sure you want to end this session?')) {
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
