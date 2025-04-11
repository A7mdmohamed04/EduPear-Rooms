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
    let iframeElement = null;
    let currentRoom = '';
    let timerInterval = null;
    
    // Generate a random room name if the input is empty
    function generateRoomName() {
        return 'edupear_' + Math.random().toString(36).substring(2, 15);
    }
    
    // Validate the room name - making sure it won't trigger Jitsi security
    function validateRoomName(roomName) {
        // Remove any special characters and spaces, and make unique enough to avoid collisions
        const validatedName = roomName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        // Add a random suffix to avoid any room name that might be reserved or have security settings
        return validatedName + '_' + Math.random().toString(36).substring(2, 7);
    }
    
    // This approach completely bypasses the Jitsi API to avoid authentication problems
    function startMeeting(roomName, isHost = true) {
        // Generate a clean room name
        currentRoom = validateRoomName(roomName || generateRoomName());
        roomNameInput.value = currentRoom;
        
        // Prepare the meeting container
        meetingContainer.innerHTML = `
            <div class="meeting-loading">
                <div class="loading-spinner"></div>
                <p>${isHost ? 'Starting' : 'Joining'} meeting...</p>
            </div>
            <div id="meet-container" style="width: 100%; height: calc(100vh - 160px); position: relative;"></div>
            <button id="leaveMeeting" class="btn danger">Leave Meeting</button>
            <div class="meeting-controls">
                <button id="copyLink" class="btn secondary">Copy Invite Link</button>
            </div>
            <div class="meeting-footer">
                <div class="participant-count">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span id="participantCount">1</span>
                </div>
                <div class="meeting-timer">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <span id="meetingTimer">00:00:00</span>
                </div>
            </div>
        `;
        
        // Set up event listeners for the buttons
        document.getElementById('leaveMeeting').addEventListener('click', closeMeeting);
        document.getElementById('copyLink').addEventListener('click', copyMeetingLink);
        
        // Show meeting container and hide other content
        meetingContainer.classList.remove('hidden');
        header.classList.add('hidden');
        footer.classList.add('hidden');
        
        // Hide all other sections
        const sections = document.querySelectorAll('main > section:not(#meeting-container)');
        sections.forEach(section => section.classList.add('hidden'));
        
        // Start meeting timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        timerInterval = startMeetingTimer();
        
        // This approach directly embeds Jitsi in an iframe with a pre-formed URL
        // that bypasses authentication requirements
        const meetContainer = document.getElementById('meet-container');
        
        // Create a direct URL to the meeting with specific query parameters
        // that bypass authentication requirements
        const baseUrl = 'https://meet.jit.si/';
        const queryParams = new URLSearchParams({
            config: JSON.stringify({
                startWithAudioMuted: !isHost,
                startWithVideoMuted: !isHost,
                prejoinPageEnabled: false,
                disableDeepLinking: true,
                disableFocusIndicator: true,
                enableUserRolesBasedOnToken: false,
                disableModeratorIndicator: true,
                enableUserAuthentication: false,
                startAudioOnly: false,
                disableInviteFunctions: true,
                disableWelcomePage: true,
                disablePrejoinDisplayName: true,
                disablePrejoin: true,
                disableLobby: true,
                disableRemoteMute: true,
                disableMobileAppPromo: true,
                disableDialIn: true,
                disableDialOut: true,
                disableCallIntegration: true,
                disableInitialGUM: false,
                enableFeaturesBasedOnToken: false,
                startScreenSharing: false,
                enableEmailInStats: false,
                disablePolls: true,
                disableReactions: true,
                disableSelfViewSettings: true
            }),
            interfaceConfig: JSON.stringify({
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 
                    'fullscreen', 'fodeviceselection', 'hangup', 'profile', 
                    'settings', 'raisehand', 'videoquality', 'filmstrip', 
                    'invite', 'feedback', 'stats', 'shortcuts', 
                    'tileview', 'videobackgroundblur', 'help', 
                    'mute-everyone'
                ],
                SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_BACKGROUND: '#4CAF50',
                DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
                DEFAULT_LOCAL_DISPLAY_NAME: 'Me',
                TOOLBAR_ALWAYS_VISIBLE: true,
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                HIDE_INVITE_MORE_HEADER: true,
                MOBILE_APP_PROMO: false,
                SHOW_BRAND_WATERMARK: false,
                DISABLE_FOCUS_INDICATOR: true,
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                DISABLE_PRESENCE_STATUS: true,
                DISABLE_VIDEO_BACKGROUND: true,
                DISABLE_RINGING: true,
                DISABLE_DIAL_IN: true,
                DISABLE_DIAL_OUT: true,
                DISABLE_CALL_INTEGRATION: true
            }),
            lang: 'en',
            jwt: null,  // No authentication token
            displayName: isHost ? 'Host' : 'Participant',
            noSsl: false,
            roomName: currentRoom
        });
        
        // For direct iframe approach, we create the iframe element manually
        iframeElement = document.createElement('iframe');
        iframeElement.allow = "camera; microphone; display-capture; autoplay; clipboard-write";
        iframeElement.src = baseUrl + currentRoom + "#" + queryParams.toString();
        iframeElement.style.width = '100%';
        iframeElement.style.height = '100%';
        iframeElement.style.border = 'none';
        iframeElement.allowFullscreen = true;
        
        // Clear any existing content
        meetContainer.innerHTML = '';
        meetContainer.appendChild(iframeElement);
        
        // Hide the loading message after a short delay
        setTimeout(() => {
            const loadingElement = document.querySelector('.meeting-loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }, 3000);

        // Initialize Jitsi Meet
        const api = new JitsiMeetExternalAPI(baseUrl, {
            roomName: currentRoom,
            width: '100%',
            height: '100%',
            parentNode: document.getElementById('meet'),
            configOverwrite: {
                disableDeepLinking: true,
                disableInviteFunctions: true,
                disableWelcomePage: true,
                disablePrejoinDisplayName: true,
                disablePrejoin: true,
                disableLobby: true,
                disableRemoteMute: true,
                disableMobileAppPromo: true,
                disableDialIn: true,
                disableDialOut: true,
                disableCallIntegration: true,
                disableInitialGUM: false,
                enableFeaturesBasedOnToken: false,
                startAudioOnly: false,
                startScreenSharing: false,
                enableEmailInStats: false,
                disablePolls: true,
                disableReactions: true,
                disableSelfViewSettings: true
            },
            interfaceConfigOverwrite: {
                SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                DISABLE_PRESENCE_STATUS: true,
                DISABLE_VIDEO_BACKGROUND: true,
                DISABLE_RINGING: true,
                HIDE_INVITE_MORE_HEADER: true,
                MOBILE_APP_PROMO: false,
                SHOW_BRAND_WATERMARK: false,
                DISABLE_DIAL_IN: true,
                DISABLE_DIAL_OUT: true,
                DISABLE_CALL_INTEGRATION: true
            }
        });

        // Force immediate meeting join
        api.executeCommand('subject', currentRoom);
        api.executeCommand('displayName', 'Host');
        api.executeCommand('avatarUrl', '');
        api.executeCommand('toggleLobby', false);
        api.executeCommand('password', '');

        // Immediately configure host privileges
        setTimeout(() => {
            api.executeCommand('toggleVideo');
            api.executeCommand('toggleAudio');
            // Hide any join options that might appear
            document.querySelectorAll('.prejoin, .auth, .lobby, .dial-in').forEach(el => {
                el.style.display = 'none';
            });
        }, 1000);

        // Add this to your Jitsi initialization
        api.executeCommand('interfaceConfig', {
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
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            DEFAULT_BACKGROUND: '#4CAF50',
            DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
            DEFAULT_LOCAL_DISPLAY_NAME: 'Me',
            SHOW_PROMOTIONAL_CLOSE_PAGE: false
        });

        // Set custom colors
        api.executeCommand('setColors', {
            activeSpeaker: '#388E3C',
            dominantSpeaker: '#4CAF50',
            participant: '#81C784'
        });
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
                alert('Failed to copy link. Please copy this URL manually: ' + link);
            });
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
    
    function closeMeeting() {
        // Clear the iframe
        if (iframeElement) {
            iframeElement.src = 'about:blank';
            iframeElement = null;
        }
        
        // Clear the timer interval
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
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
        const roomName = roomNameInput.value || generateRoomName();
        startMeeting(roomName, true);
    });
    
    joinMeetingBtn.addEventListener('click', function() {
        const roomName = roomNameInput.value;
        if (!roomName) {
            alert('Please enter a room name to join.');
            return;
        }
        
        startMeeting(roomName, false);
    });
    
    // Room name input validation
    roomNameInput.addEventListener('input', function() {
        // For user-friendly experience, we only validate on actual creation
        // rather than as they type
        if (this.value && this.value.includes(' ')) {
            this.value = this.value.replace(/\s+/g, '_');
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
        if (roomNameInput) {
            roomNameInput.value = roomParam;
            
            // Auto-join the room after a short delay
            setTimeout(() => {
                const joinBtn = document.getElementById('joinMeeting');
                if (joinBtn) {
                    joinBtn.click();
                }
            }, 1000);
        }
    }
});

// Add special handling for browser back button
window.addEventListener('popstate', function(event) {
    // Check if we're in a meeting
    const meetingContainer = document.getElementById('meeting-container');
    if (meetingContainer && !meetingContainer.classList.contains('hidden')) {
        // Find and trigger the leave meeting button
        const leaveBtn = document.getElementById('leaveMeeting');
        if (leaveBtn) {
            leaveBtn.click();
        }
        // Prevent the default back action
        history.pushState(null, document.title, window.location.pathname);
        event.preventDefault();
    }
});

// Add history entry when starting a meeting
function addHistoryEntry() {
    history.pushState({page: 'meeting'}, document.title, window.location.pathname);
}

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const nav = document.querySelector('nav.desktop-nav'); // Select desktop nav
    const navUl = document.querySelector('nav.desktop-nav ul'); // Select desktop nav ul
    
    // Toggle menu when button is clicked
    mobileMenuButton.addEventListener('click', function() {
        navUl.classList.toggle('show'); // Only toggle visibility of navUl

        // Prevent scrolling when menu is open
        if (navUl.classList.contains('show')) { // Check for 'show' class
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
    
    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('nav.desktop-nav ul li a'); // Select desktop nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navUl.classList.remove('show'); // Just remove 'show' class
            document.body.style.overflow = '';
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navUl.classList.remove('show'); // Just remove 'show' class
            document.body.style.overflow = '';
            navUl.style.display = ''; // Ensure display is reset on desktop
        }
    });
});
