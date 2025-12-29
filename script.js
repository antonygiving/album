// Email unlock system
let isUnlocked = false;

// Check if user has already unlocked
window.addEventListener('DOMContentLoaded', () => {
    const unlocked = localStorage.getItem('albumUnlocked');
    if (unlocked === 'true') {
        isUnlocked = true;
    }
});

// Scroll to tracks
function scrollToTracks() {
    document.getElementById('tracks').scrollIntoView({ behavior: 'smooth' });
}

// Modal functionality
const modal = document.getElementById('emailModal');
const closeBtn = document.querySelector('.close');

function showEmailModal() {
    if (!isUnlocked) {
        modal.style.display = 'block';
    }
}

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Email form submission
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('emailInput').value;
    
    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success (201 or 409)
            console.log('Email submitted:', email);
            
            // Mark as unlocked
            localStorage.setItem('albumUnlocked', 'true');
            localStorage.setItem('userEmail', email);
            isUnlocked = true;
            
            // Show success message
            if (response.status === 201) {
                alert('🎉 Subscribed successfully! Access unlocked! You can now listen to full tracks and the exclusive bonus.');
            } else if (response.status === 409) {
                alert('🎉 Already subscribed! Access unlocked! You can now listen to full tracks and the exclusive bonus.');
            }
            
            // Close modal
            modal.style.display = 'none';
        } else {
            // Error
            alert(`Error: ${data.error || 'Something went wrong'}`);
        }
    } catch (error) {
        console.error('Subscription error:', error);
        alert('Error: Unable to subscribe. Please try again.');
    }
});

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add parallax effect to hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - (scrolled / 600);
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all track cards
document.querySelectorAll('.track-card').forEach(card => {
    observer.observe(card);
});

// Custom cursor effect (optional - can be removed if too much)
document.addEventListener('mousemove', (e) => {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';
    cursor.style.left = e.pageX + 'px';
    cursor.style.top = e.pageY + 'px';
    document.body.appendChild(cursor);
    
    setTimeout(() => cursor.remove(), 500);
});

// Add cursor trail styles dynamically
const style = document.createElement('style');
style.textContent = `
    .cursor-trail {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, transparent 70%);
        pointer-events: none;
        animation: cursorFade 0.5s ease-out forwards;
        z-index: 9999;
    }
    
    @keyframes cursorFade {
        to {
            opacity: 0;
            transform: scale(2);
        }
    }
`;
document.head.appendChild(style);

// Check unlock status for track pages
function checkUnlockStatus() {
    return localStorage.getItem('albumUnlocked') === 'true';
}

// Export for use in other pages
window.checkUnlockStatus = checkUnlockStatus;
window.showEmailModal = showEmailModal;
