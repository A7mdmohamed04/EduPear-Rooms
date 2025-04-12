const JAAS_API_KEY = 'vpaas-magic-cookie-cd5d26f56f144b1b98a592ee6ceb3299';
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

    // Initialize Jitsi Meet with JAAS
    const domain = '8x8.vc';
    const options = {
        roomName: roomName,
        width: '100%',
        height: 500,
        parentNode: document.querySelector('#video-call'),
        jwt: generateJWT(roomName),
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false
        },
        configOverwrite: {
            disableSimulcast: false,
            startWithAudioMuted: true,
            startWithVideoMuted: true
        }
    };

    jitsiApi = new JitsiMeetExternalAPI(domain, options);
}

// Add this utility function before generateJWT
function base64url(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Generate JWT for JAAS authentication
function generateJWT(roomName) {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
        kid: 'vpaas-magic-cookie'
    };

    const payload = {
        aud: 'jitsi',
        context: {
            user: {
                name: 'Host/Moderator',
                email: '',
                avatar: ''
            }
        },
        iss: 'chat',
        room: roomName,
        sub: 'meet.jitsi.np',
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        nbf: Math.floor(Date.now() / 1000) - 10
    };

    // Encode header and payload
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));

    // Create signature
    const signature = base64url(
        crypto.subtle.sign(
            { name: 'HMAC' },
            new TextEncoder().encode(JAAS_API_KEY),
            new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
        )
    );

    // Return the JWT
    return `${encodedHeader}.${encodedPayload}.${signature}`;
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
