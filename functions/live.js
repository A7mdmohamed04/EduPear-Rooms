/**
 * Live Streaming functionality using JaaS (Jitsi as a Service)
 * For educational platforms
 */

// ===== JaaS CONFIGURATION =====
// ADD YOUR JAAS API KEY HERE
const JAAS_APP_ID = null; // Not needed for anonymous access
const JAAS_API_KEY = null; // Not needed for anonymous access

// Room configuration
let roomName = `edu-session-${generateRandomRoomId()}`;
let displayName = '';
let userRole = localStorage.getItem('userType') || 'student';
let api = null;
let participantsList = [];

// DOM Elements
const joinModal = document.getElementById('join-modal');
const displayNameInput = document.getElementById('display-name');
const sessionCodeInput = document.getElementById('session-code');
const joinSessionBtn = document.getElementById('join-session-btn');
const jaasContainer = document.getElementById('jaas-container');
const participantsListEl = document.getElementById('participants-list');
const chatMessagesEl = document.getElementById('chat-messages');
const chatTextInput = document.getElementById('chat-text');
const sendChatBtn = document.getElementById('send-chat');
const sessionTitleEl = document.getElementById('session-title');
const subjectNameEl = document.getElementById('subject-name');
const userNameEl = document.getElementById('user-name');
const connectionStatusEl = document.getElementById('connection-status');

// Control buttons
const micBtn = document.getElementById('mic-btn');
const cameraBtn = document.getElementById('camera-btn');
const screenBtn = document.getElementById('screen-btn');
const settingsBtn = document.getElementById('settings-btn');
const endCallBtn = document.getElementById('end-call-btn');

// Initialize the page
document.addEventListener('DOMContentLoaded', initializeLivePage);

function initializeLivePage() {
    // Check URL parameters for any session info
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('room')) {
        roomName = urlParams.get('room');
    }
    if (urlParams.has('subject')) {
        subjectNameEl.textContent = urlParams.get('subject');
        sessionTitleEl.textContent = `${urlParams.get('subject')} Class Session`;
    }

    // Set user's display name if available in local storage
    displayNameInput.value = localStorage.getItem('userName') || '';
    userNameEl.textContent = displayNameInput.value;

    // Show join modal
    joinModal.style.display = 'flex';

    // Add event listeners
    joinSessionBtn.addEventListener('click', handleJoinSession);
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Control buttons
    micBtn.addEventListener('click', toggleAudio);
    cameraBtn.addEventListener('click', toggleVideo);
    screenBtn.addEventListener('click', toggleScreenShare);
    settingsBtn.addEventListener('click', openSettings);
    endCallBtn.addEventListener('click', endMeeting);
}

function handleJoinSession() {
    displayName = displayNameInput.value.trim();
    if (!displayName) {
        alert('Please enter your display name');
        return;
    }

    // Save display name for future use
    localStorage.setItem('userName', displayName);
    userNameEl.textContent = displayName;

    // Check if custom session code provided
    if (sessionCodeInput.value.trim()) {
        roomName = sessionCodeInput.value.trim();
    }

    // Hide join modal
    joinModal.style.display = 'none';

    // Initialize JaaS
    initializeJaas();
}

function initializeJaas() {
    // Set connection status
    connectionStatusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

    const domain = '8x8.vc';
    
    // JaaS configuration options
    const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jaasContainer,
        configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            defaultLanguage: 'en',
            enableWelcomePage: false,
            enableClosePage: false,
            enableNoisyMicDetection: false,
            disableRemoteMute: true
        },
        interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop',
                'fullscreen', 'fodeviceselection', 'hangup', 'profile',
                'recording', 'livestreaming', 'etherpad', 'sharedvideo',
                'settings', 'raisehand', 'videoquality', 'filmstrip',
                'feedback', 'stats', 'shortcuts', 'tileview', 'select-background',
                'download', 'help', 'mute-everyone', 'security'
            ],
            SHOW_JITSI_WATERMARK: false,
            HIDE_INVITE_MORE_HEADER: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            MOBILE_APP_PROMO: false,
            VIDEO_LAYOUT_FIT: 'both',
            TILE_VIEW_MAX_COLUMNS: 5
        },
        userInfo: {
            displayName: displayName,
            email: localStorage.getItem('userEmail') || '',
            role: userRole
        }
    };

    try {
        // Create JaaS API instance
        api = new JitsiMeetExternalAPI(domain, options);
        
        // Add event listeners
        api.addListener('videoConferenceJoined', handleVideoConferenceJoined);
        api.addListener('participantJoined', handleParticipantJoined);
        api.addListener('participantLeft', handleParticipantLeft);
        api.addListener('audioMuteStatusChanged', handleAudioStatusChange);
        api.addListener('videoMuteStatusChanged', handleVideoStatusChange);
        api.addListener('screenSharingStatusChanged', handleScreenSharingStatusChange);
        api.addListener('outgoingMessage', handleOutgoingMessage);
        api.addListener('incomingMessage', handleIncomingMessage);
        api.addListener('readyToClose', handleReadyToClose);
        api.addListener('connectionEstablished', () => {
            connectionStatusEl.innerHTML = '<i class="fas fa-signal"></i> Connected';
        });
        api.addListener('connectionFailed', () => {
            connectionStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Connection Failed';
        });
        api.addListener('connectionInterrupted', () => {
            connectionStatusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Connection Interrupted';
        });
    } catch (error) {
        console.error('Failed to initialize JaaS:', error);
        connectionStatusEl.innerHTML = '<i class="fas fa-times-circle"></i> Connection Error';
        alert('Failed to connect to the video conference. Please try again later.');
    }
}

// Handle conference events
function handleVideoConferenceJoined(event) {
    console.log('Joined conference', event);
    updateParticipantsList();
    addSystemMessage('You have joined the session');
}

function handleParticipantJoined(event) {
    console.log('Participant joined', event);
    updateParticipantsList();
    addSystemMessage(`${event.displayName || 'A participant'} has joined`);
}

function handleParticipantLeft(event) {
    console.log('Participant left', event);
    updateParticipantsList();
    addSystemMessage(`${event.displayName || 'A participant'} has left`);
}

// Media controls functions
function toggleAudio() {
    if (api) {
        api.executeCommand('toggleAudio');
    }
}

function toggleVideo() {
    if (api) {
        api.executeCommand('toggleVideo');
    }
}

function toggleScreenShare() {
    if (api) {
        api.executeCommand('toggleShareScreen');
    }
}

function openSettings() {
    if (api) {
        api.executeCommand('openDeviceSelectionPopup');
    }
}

function endMeeting() {
    if (confirm('Are you sure you want to leave this session?')) {
        if (api) {
            api.executeCommand('hangup');
        }
        window.location.href = 'home.html';
    }
}

// Media status change handlers
function handleAudioStatusChange(event) {
    console.log('Audio mute status changed', event);
    if (event.muted) {
        micBtn.classList.add('active');
    } else {
        micBtn.classList.remove('active');
    }
}

function handleVideoStatusChange(event) {
    console.log('Video mute status changed', event);
    if (event.muted) {
        cameraBtn.classList.add('active');
    } else {
        cameraBtn.classList.remove('active');
    }
}

function handleScreenSharingStatusChange(event) {
    console.log('Screen sharing status changed', event);
    if (event.on) {
        screenBtn.classList.add('active');
    } else {
        screenBtn.classList.remove('active');
    }
}

function handleReadyToClose() {
    console.log('Conference is about to close');
    window.location.href = 'home.html';
}

// Chat functions
function sendChatMessage() {
    const message = chatTextInput.value.trim();
    if (message && api) {
        api.executeCommand('sendChatMessage', message);
        chatTextInput.value = '';
        
        // Also add to local chat display
        addChatMessage({
            sender: displayName,
            message: message,
            isOwn: true
        });
    }
}

function handleOutgoingMessage(event) {
    console.log('Outgoing message', event);
}

function handleIncomingMessage(event) {
    console.log('Incoming message', event);
    if (event.from !== displayName) {
        addChatMessage({
            sender: event.from,
            message: event.message,
            isOwn: false
        });
    }
}

function addChatMessage({ sender, message, isOwn = false }) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isOwn ? 'own-message' : ''}`;
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    
    const senderEl = document.createElement('span');
    senderEl.className = 'message-sender';
    senderEl.textContent = sender;
    
    const timeEl = document.createElement('span');
    timeEl.className = 'message-time';
    timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageHeader.appendChild(senderEl);
    messageHeader.appendChild(timeEl);
    
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = message;
    
    messageEl.appendChild(messageHeader);
    messageEl.appendChild(contentEl);
    
    chatMessagesEl.appendChild(messageEl);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function addSystemMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message system-message';
    
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content system';
    contentEl.textContent = message;
    
    messageEl.appendChild(contentEl);
    chatMessagesEl.appendChild(messageEl);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Participants list functions
function updateParticipantsList() {
    if (!api) return;
    
    api.getParticipantsInfo().then(participants => {
        participantsList = participants;
        renderParticipantsList();
    });
}

function renderParticipantsList() {
    participantsListEl.innerHTML = '';
    
    participantsList.forEach(participant => {
        const participantEl = document.createElement('div');
        participantEl.className = 'participant';
        
        const avatarEl = document.createElement('div');
        avatarEl.className = 'participant-avatar';
        avatarEl.textContent = getInitials(participant.displayName || 'User');
        
        const nameEl = document.createElement('div');
        nameEl.className = 'participant-name';
        nameEl.textContent = participant.displayName || 'Unknown User';
        
        const roleEl = document.createElement('div');
        roleEl.className = 'participant-role';
        
        // Check if it's the local participant
        if (participant.isLocal) {
            roleEl.textContent = userRole === 'teacher' ? 'Teacher' : 'Student';
        } else {
            roleEl.textContent = 'Participant';
        }
        
        participantEl.appendChild(avatarEl);
        participantEl.appendChild(nameEl);
        participantEl.appendChild(roleEl);
        
        participantsListEl.appendChild(participantEl);
    });
}

// Utility functions
function generateRandomRoomId() {
    return Math.random().toString(36).substring(2, 10);
}

function getInitials(name) {
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Generate JWT for JaaS
 * You MUST replace this with your actual JWT generation using your API keys
 * For production, this should be done server-side for security
 */
function generateJaasJwt() {
    return null; // No JWT required for anonymous sessions
}
