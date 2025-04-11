let jitsiApi;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Host: Create new room
    document.getElementById('start-session-btn').addEventListener('click', createRoom);

    // Join existing room
    document.getElementById('join-session-btn').addEventListener('click', joinRoom);

    // Leave call
    document.getElementById('leave-btn').addEventListener('click', leaveRoom);
});

// Create a new room
function createRoom() {
    const roomName = document.getElementById('room-name').value.trim();
    if (!roomName) {
        alert('Please enter a room name');
        return;
    }
    startCall(roomName);
}

// Join an existing room
function joinRoom() {
    const roomName = document.getElementById('room-url').value.trim();
    if (!roomName) {
        alert('Please enter a room name');
        return;
    }
    startCall(roomName);
}

// Start the video call
function startCall(roomName) {
    // Hide host and join sections
    document.getElementById('host-section').style.display = 'none';
    document.getElementById('join-section').style.display = 'none';
    
    // Show video container
    const videoContainer = document.getElementById('video-container');
    videoContainer.style.display = 'block';

    // Initialize Jitsi Meet
    const domain = 'meet.jit.si';
    const options = {
        roomName: roomName,
        width: '100%',
        height: 500,
        parentNode: document.querySelector('#video-call'),
        userInfo: {
            displayName: 'Teacher/Student'
        }
    };

    jitsiApi = new JitsiMeetExternalAPI(domain, options);
}

// Leave the room
function leaveRoom() {
    if (jitsiApi) {
        jitsiApi.dispose();
    }
    
    // Show host and join sections
    document.getElementById('host-section').style.display = 'block';
    document.getElementById('join-section').style.display = 'block';
    
    // Hide video container
    document.getElementById('video-container').style.display = 'none';
}
