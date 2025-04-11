document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const roomNameInput = document.getElementById('roomName');
    const createMeetingBtn = document.getElementById('createMeeting');
    const joinMeetingBtn = document.getElementById('joinMeeting');
    const leaveMeetingBtn = document.getElementById('leaveMeeting');
    const meetingContainer = document.getElementById('meeting-container');
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    
    // Global variables
    let api = null;
    let currentRoom = '';
    
    // Generate a random room name if the input is empty
    function generateRoomName() {
        return 'edupear_' + Math.random().toString(36).substring(2, 15);
    }
    
    // Validate the room name
    function validateRoomName(roomName) {
        // Remove any special characters and spaces
        return roomName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    }
    
    // Initialize the Jitsi Meet API
    function initializeJitsi(roomName, isHost = true) {
        // Show loading state
        meetingContainer.innerHTML = `
            <div class="meeting-loading">
                <div class="loading-spinner"></div>
                <p>${isHost ? 'Starting' : 'Joining'} meeting...</p>
            </div>
            <div id="meet"></div>
            <div class="meeting-footer">
                <div class="participant-count">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span id="participantCount">0</span>
                </div>
                <div class="meeting-timer">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <span id="meetingTimer">00:00:00</span>
                </div>
            </div>
        `;
        
        currentRoom = validateRoomName(roomName || generateRoomName());
        roomNameInput.value = currentRoom;
        
        // Update room name display
        const roomNameDisplay = document.getElementById('current-room-name');
        if (roomNameDisplay) {
            roomNameDisplay.textContent = currentRoom;
        }
        
        // Show meeting container and hide other content
        meetingContainer.classList.remove('hidden');
        header.classList.add('hidden');
        footer.classList.add('hidden');
        
        // Hide all other sections
        const sections = document.querySelectorAll('main > section:not(#meeting-container)');
        sections.forEach(section => section.classList.add('hidden'));
        
        // Start meeting timer
        startMeetingTimer();
        
        // Configuration for Jitsi Meet
        const domain = 'meet.jit.si';
        const options = {
            roomName: currentRoom,
            width: '100%',
            height: '100%',
            parentNode: document.getElementById('meet'),
            configOverwrite: {
                startWithAudioMuted: !isHost,
                startWithVideoMuted: !isHost,
                prejoinPageEnabled: false,
                disableDeepLinking: true,
                requireDisplayName: false,
                disableProfile: true,
                enableWelcomePage: false,
                enableClosePage: false,
                disableInviteFunctions: true,
                enableNoisyMicDetection: false,
                disableRemoteMute: true,
                enableUserRolesBasedOnToken: false,
                disableRemoteVideoMenu: true,
                disableInitialGUM: false,
                enableFeaturesBasedOnToken: false,
                startAudioOnly: false,
                startScreenSharing: false,
                enableEmailInStats: false,
                disablePolls: true,
                disableReactions: true,
                disableSelfViewSettings: true,
                startAudioMuted: 1,
                startVideoMuted: 1,
                enableUserRolesBasedOnToken: false,
                enableUserAuthentication: false,
                authentication: {
                    disabled: true
                },
                hosts: {
                    domain: 'meet.jit.si',
                    anonymousdomain: 'guest.meet.jit.si',
                    authdomain: 'meet.jit.si'
                }
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 
                    'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
                    'settings', 'raisehand', 'videoquality', 'filmstrip', 
                    'invite', 'feedback', 'stats', 'shortcuts', 
                    'tileview', 'videobackgroundblur', 'help', 
                    'mute-everyone'
                ],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_BACKGROUND: '#111',
                DEFAULT_REMOTE_DISPLAY_NAME: 'EduPear User',
                TOOLBAR_ALWAYS_VISIBLE: false,
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                DISABLE_PRESENCE_STATUS: true,
                DISABLE_VIDEO_BACKGROUND: true,
                DISABLE_RINGING: true,
                HIDE_INVITE_MORE_HEADER: true,
                MOBILE_APP_PROMO: false,
                SHOW_BRAND_WATERMARK: false
            }
        };
        
        // Ensure meet container exists before initializing Jitsi
        const meetContainer = document.getElementById('meet');
        if (!meetContainer) {
            console.error('Meet container not found');
            return;
        }
        
        api = new JitsiMeetExternalAPI(domain, options);
        
        // Force host mode and skip authentication
        api.executeCommand('subject', currentRoom);
        api.executeCommand('displayName', 'Host');
        api.executeCommand('avatarUrl', '');
        api.executeCommand('toggleLobby', false);
        api.executeCommand('password', '');
        
        // Immediately configure host privileges
        setTimeout(() => {
            api.executeCommand('toggleVideo');
            api.executeCommand('toggleAudio');
            api.executeCommand('startRecording', {
                mode: 'file',
                dropboxToken: ''
            });
        }, 1000);
        
        // Event handlers
        api.addEventListeners({
            readyToClose: handleClose,
            videoConferenceJoined: function() {
                console.log('Meeting joined as host');
                // Force host controls
                api.executeCommand('toggleShareScreen');
                api.executeCommand('toggleFilmStrip');
                // Hide any remaining auth elements
                document.querySelectorAll('.prejoin, .auth, .lobby').forEach(el => {
                    el.style.display = 'none';
                });
            },
            videoConferenceLeft: handleClose,
            participantJoined: updateParticipantCount,
            participantLeft: updateParticipantCount
        });
        
        // Update participant count initially
        updateParticipantCount();
        
        // Safely add copy link button event listener
        const copyLinkBtn = document.getElementById('copyLink');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', copyMeetingLink);
        }
    }
    
    function startMeetingTimer() {
        const timerElement = document.getElementById('meetingTimer');
        if (!timerElement) {
            console.error('Timer element not found');
            return null;
        }

        let seconds = 0;
        return setInterval(() => {
            seconds++;
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            timerElement.textContent = 
                `${hours.toString().padStart(2, '0')}:` +
                `${minutes.toString().padStart(2, '0')}:` +
                `${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    function updateParticipantCount() {
        if (api) {
            const participants = api.getNumberOfParticipants() + 1; // +1 for local participant
            document.getElementById('participantCount').textContent = participants;
        }
    }
    
    function copyMeetingLink() {
        const link = createShareLink(currentRoom);
        navigator.clipboard.writeText(link)
            .then(() => {
                const copyBtn = document.getElementById('copyLink');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy Invite Link';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy link: ', err);
            });
    }
    
    // Handle closing the meeting
    function handleClose() {
        if (api) {
            api.dispose();
            api = null;
        }
        
        // Hide the meeting container and show other content
        meetingContainer.classList.add('hidden');
        header.classList.remove('hidden');
        footer.classList.remove('hidden');
        
        // Show all other sections
        const sections = document.querySelectorAll('main > section.hidden:not(#meeting-container)');
        sections.forEach(section => {
            section.classList.remove('hidden');
        });
        
        // Clear the room name input
        roomNameInput.value = '';
    }
    
    // Event listeners
    createMeetingBtn.addEventListener('click', function() {
        const roomName = roomNameInput.value;
        initializeJitsi(roomName, true);
    });
    
    joinMeetingBtn.addEventListener('click', function() {
        const roomName = roomNameInput.value;
        if (!roomName) {
            alert('Please enter a room name to join.');
            return;
        }
        
        try {
            initializeJitsi(roomName, false);
        } catch (error) {
            console.error('Error joining meeting:', error);
            alert('Failed to join meeting. Please try again.');
        }
    });
    
    leaveMeetingBtn.addEventListener('click', handleClose);
    
    // Room name input validation
    roomNameInput.addEventListener('input', function() {
        const validatedName = validateRoomName(this.value);
        if (validatedName !== this.value) {
            this.value = validatedName;
        }
    });
    
    // Generate a random room name when the page loads
    roomNameInput.setAttribute('placeholder', `Try "${generateRoomName()}"`);
});

// Create a dynamic room link for sharing
function createShareLink(roomName) {
    return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomName)}`;
}

// Check if there's a room parameter in the URL when the page loads
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
        const roomNameInput = document.getElementById('roomName');
        roomNameInput.value = roomParam;
        
        // Auto-join the room after a short delay
        setTimeout(() => {
            document.getElementById('joinMeeting').click();
        }, 1000);
    }
});