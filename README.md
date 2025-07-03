# Micro-Learning  & Tutoring 

A lightweight real-time tutoring platform that connects students with tutors for one-on-one sessions.



## Core Features
- Live video sessions (WebRTC)
- Interactive whiteboard with drawing tools
- Scheduler & reminders
- User authentication
- Real-time chat


## Technology Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: SQLite
- Real-time Communication: Socket.io
- Authentication: JWT

## Project Structure
- `/frontend` - HTML, CSS, and JavaScript files for the client-side
- `/backend` - Node.js server with Express and Socket.io
- `/docs` - Documentation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository
   ```
   git clone https://github.com/hafedEfheij/Tutoring-Platform.git
   cd Tutoring-Platform
   ```

2. Install backend dependencies
   ```
   cd backend
   npm install
   ```

### Running the Application
1. Start the backend server
   ```
   cd backend
   npm start
   ```

2. Open the frontend in your browser
   - Navigate to `http://localhost:3000` in your web browser
   - The server will serve the static frontend files

## Features

### User Authentication
- Register as a student or tutor
- Login with email and password
- JWT-based authentication

### Dashboard
- View upcoming sessions
- See recommended tutors
- Track learning progress

### Scheduling
- Book new sessions with tutors
- View calendar with scheduled sessions
- Receive reminders for upcoming sessions

### Whiteboard
- Real-time drawing and collaboration
- Multiple tools: pen, eraser, text, shapes
- Save whiteboard content

### Video Chat
- One-on-one video sessions
- Audio controls
- Screen sharing

## License
This project is licensed under the ISC License


