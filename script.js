// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust for header height
                    behavior: 'smooth'
                });
            }
        });
    });

    // Basic room creation functionality (placeholder)
    const createRoomBtn = document.querySelector('.create-room-btn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', function() {
            alert('Room creation functionality will be implemented with PeerJS. This is a placeholder.');
            // In a real implementation, you would:
            // 1. Generate a unique room ID
            // 2. Initialize PeerJS
            // 3. Set up WebRTC connections
            // 4. Redirect to a room page
        });
    }

    // Basic room joining functionality (placeholder)
    const joinRoomBtn = document.querySelector('.join-room-btn');
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', function() {
            const roomId = prompt('Enter the room ID:');
            if (roomId) {
                alert(`Joining room ${roomId}. This is a placeholder.`);
                // In a real implementation, you would:
                // 1. Validate the room ID
                // 2. Initialize PeerJS
                // 3. Connect to the specified peer
                // 4. Redirect to the room page
            }
        });
    }

    // Form submission handling (placeholder)
    const contactForm = document.querySelector('.contact form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // Basic validation
            if (!name || !email || !message) {
                alert('Please fill out all fields');
                return;
            }
            
            // Placeholder for form submission
            alert('Thank you for your message! This is a placeholder for form submission.');
            contactForm.reset();
        });
    }

    // Mobile menu functionality could be added here
    // This would be implemented when you add a hamburger menu for mobile views
});