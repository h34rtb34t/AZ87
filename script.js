// --- Simple Analytics Tracker ---
const INGESTION_WORKER_URL = 'https://stats-ingress-worker.azelbane87.workers.dev/'; // <-- Worker URL Integrated

// --- Simplified trackEvent for Debugging ---
function trackEvent(eventType, eventData = {}) {
    if (!INGESTION_WORKER_URL || INGESTION_WORKER_URL === 'YOUR_COPIED_INGESTION_WORKER_URL') {
        console.warn('Analytics Ingestion URL not configured. Tracking disabled.');
        return;
    }
    const payload = {
        type: eventType,
        page: window.location.pathname + window.location.search + window.location.hash,
        timestamp: new Date().toISOString(),
        screenWidth: window.screen.width,
        ...eventData
    };

    console.log(`[DEBUG] Preparing to send event: ${eventType}`, payload); // Log before fetch

    fetch(INGESTION_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // keepalive might be useful even for fetch
    })
    .then(response => {
         console.log(`[DEBUG] Fetch response received for ${eventType}. Status: ${response.status}`);
         if (!response.ok) {
             console.warn(`[DEBUG] Fetch tracking response not OK: ${response.status}`, payload);
         }
         // Try to read response body if error for more info (optional)
         // if (!response.ok) {
         //     response.text().then(text => console.warn(`[DEBUG] Fetch error response body: ${text}`));
         // }
     })
    .catch(error => {
         console.error(`[DEBUG] Error sending tracking data (fetch) for ${eventType}:`, error, payload);
     });
}

// Remove the old sendWithFetch function if it exists separately
// function sendWithFetch(payload) { /* ... remove this ... */ }
    // Use navigator.sendBeacon if available for page unload/link clicks
    if ((eventType === 'pageview' || eventType === 'link_click') && navigator.sendBeacon) {
         try {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            if(navigator.sendBeacon(INGESTION_WORKER_URL, blob)) {
                // Optional: console.log('Beacon sent for:', eventType);
            } else {
                console.warn('Beacon failed to queue for:', eventType, payload);
                sendWithFetch(payload); // Fallback if beacon queueing fails immediately
            }
         } catch (e) {
            console.error('Beacon error:', e);
            sendWithFetch(payload); // Fallback if immediate error
         }
    } else {
        sendWithFetch(payload);
    }
}

function sendWithFetch(payload) {
     fetch(INGESTION_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true // Important for fetch on page unload scenarios (though beacon is better)
    })
    .then(response => {
        // Optional: Check response status for debugging if needed
        // if (!response.ok) {
        //     console.warn('Fetch tracking response not OK:', response.status, payload);
        // }
    })
    .catch(error => { console.error('Error sending tracking data (fetch):', error, payload); });
}

// --- Track Page View ---
document.addEventListener('DOMContentLoaded', () => {
    trackEvent('pageview');
});

// --- General Link Click Tracker (Placed outside main DOMContentLoaded) ---
document.addEventListener('click', function(event) {
    const link = event.target.closest('a'); // Find the nearest ancestor anchor tag

    if (link && link.href) { // Check if it's a link with an href
        const href = link.getAttribute('href'); // Get href attribute directly

        // Explicitly ignore internal page navigation links starting with '#'
        if (href.startsWith('#')) {
            // console.log('Ignoring internal hash link:', href);
            return;
        }

        // Determine if this click's primary action is handled elsewhere more specifically
        const isMainNavPubLink = link.id === 'publications-link' || link.id === 'publications-link-mobile';
        const isPubItemLink = link.closest('.publication-item') !== null;
        // Title clicks are handled separately for description modal or specific PDFs
        const isTitleClick = event.target.matches('.project-info h3[data-project-id]') || event.target.closest('.project-info h3[data-project-id]');
        // Image clicks handled separately for slideshow
        const isProjectImageClick = event.target.closest('.project-image[data-project-id]') !== null;

        // Only track here if NOT handled by specific logic AND not an internal anchor
        if (!isMainNavPubLink && !isPubItemLink && !isTitleClick && !isProjectImageClick) {
            let linkType = 'generic_link'; // Default type
            let context = '';

            // Try to get context if it's within a project card
            const projectCard = link.closest('.project-card');
            if (projectCard) {
                const titleElement = projectCard.querySelector('h3[data-project-id]');
                 if (titleElement) context = titleElement.getAttribute('data-project-id');
            }

            // Refine linkType based on context or URL patterns
            if (link.closest('.project-links')) linkType = 'project_link'; // Link within the specific project links section
            if (link.closest('.social-links') || link.closest('.contact-links a[href*="linkedin"]') || link.closest('.contact-links a[href*="github"]')) linkType = 'social_contact_link';
            if (href.includes('github.com') && linkType === 'generic_link') linkType = 'github_link'; // Refine generic if it's github
            if (href.includes('vimeo.com')) linkType = 'video_platform_link';
            if (href.includes('buymeacoffee.com')) linkType = 'donation_link';
            if (href.endsWith('.mp4')) linkType = 'direct_video_link';
            if (href.endsWith('.pdf')) linkType = 'direct_pdf_link'; // Track direct PDF link clicks here too
            // Note: target=_blank is common, maybe not the best primary classifier
            // if (link.getAttribute('target') === '_blank') linkType += '_external'; // Could append this

             console.log(`Tracking general link click: Type=${linkType}, URL=${href}`); // Add log before tracking

             // *** THE FIX IS HERE: Use 'linkType', not 'type' ***
             trackEvent('link_click', {
                url: href,
                text: link.textContent.trim().substring(0, 50),
                linkType: linkType, // <-- CORRECTED PROPERTY NAME
                context: context || undefined // Send context or explicitly undefined if empty
             });
             // *** END FIX ***
        } else {
            // Optional log for clicks handled elsewhere (for debugging if needed)
            // console.log('Link click handled by specific listener, not general tracker:', href);
        }
    }
 }, false); // Use bubbling phase

console.log('Basic tracker defined. Main script follows.');


// ----------------------------------------------------------------------- //
// --- MAIN SCRIPT CONTENT STARTS HERE ---                                 //
// (Theme, Modals, Slideshow, Publications, ScrollTop, Footer, Protection, Feedback Slider)
// --- NO CHANGES NEEDED IN THIS SECTION ---                             //
// ----------------------------------------------------------------------- //

document.addEventListener('DOMContentLoaded', function() {

    // --- START: Theme Toggle Logic ---
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const themeToggleButtonMobile = document.getElementById('theme-toggle-btn-mobile');
    const body = document.body;
    const sunIconDesktop = themeToggleButton?.querySelector('.sun-icon');
    const moonIconDesktop = themeToggleButton?.querySelector('.moon-icon');
    const sunIconMobile = themeToggleButtonMobile?.querySelector('.sun-icon');
    const moonIconMobile = themeToggleButtonMobile?.querySelector('.moon-icon');

    const updateButtonState = (theme) => {
        const isLight = theme === 'light';
        if (sunIconDesktop && moonIconDesktop) { sunIconDesktop.style.display = isLight ? 'block' : 'none'; moonIconDesktop.style.display = isLight ? 'none' : 'block'; themeToggleButton.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme'); }
         if (sunIconMobile && moonIconMobile) { sunIconMobile.style.display = isLight ? 'block' : 'none'; moonIconMobile.style.display = isLight ? 'none' : 'block'; themeToggleButtonMobile.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme'); }
    };
    const applyTheme = (theme) => {
        if (theme === 'light') { body.classList.add('light-theme'); } else { body.classList.remove('light-theme'); }
        updateButtonState(theme);
        try { localStorage.setItem('portfolioTheme', theme); } catch (e) { console.warn("Could not save theme preference:", e); }
    };
    const handleToggleClick = () => { const currentThemeIsLight = body.classList.contains('light-theme'); const newTheme = currentThemeIsLight ? 'dark' : 'light'; applyTheme(newTheme); trackEvent('theme_change', { theme: newTheme }); };
    let savedTheme = 'dark'; try { savedTheme = localStorage.getItem('portfolioTheme') || 'dark'; } catch (e) { console.warn("Could not read theme preference:", e); } applyTheme(savedTheme);
    if (themeToggleButton) { themeToggleButton.addEventListener('click', handleToggleClick); }
     if (themeToggleButtonMobile) { themeToggleButtonMobile.addEventListener('click', handleToggleClick); }
    // --- END: Theme Toggle Logic ---


    // --- Elements ---
    const pdfModal = document.getElementById("pdfModal"); const pdfViewer = document.getElementById("pdfViewer"); const imageModal = document.getElementById("imageModal"); const slideImage = document.getElementById("slideImage"); const prevBtn = document.getElementById("prevBtn"); const nextBtn = document.getElementById("nextBtn"); const slideCounter = document.getElementById("slideCounter"); const publicationsModal = document.getElementById("publicationsModal"); const publicationsGrid = document.getElementById("publicationsGrid"); const descriptionModal = document.getElementById('descriptionModal'); const modalDescImage = document.getElementById('modalDescImage'); const modalDescTitle = document.getElementById('modalDescTitle'); const modalDescText = document.getElementById('modalDescText'); const publicationsLink = document.getElementById("publications-link"); const publicationsLinkMobile = document.getElementById("publications-link-mobile"); const hamburgerMenu = document.getElementById("hamburger-menu"); const mobileNavPanel = document.getElementById("mobile-nav-panel"); const mobileNavLinks = document.querySelectorAll(".mobile-nav-link"); const scrollToTopBtn = document.getElementById('scrollToTopBtn'); const closeModalBtns = document.querySelectorAll('[data-close-modal]'); const revealElements = document.querySelectorAll('.reveal');

    // --- Slideshow Data --- (Assumed Correct)
    const slideshowData = { 'drake-music-project': { totalSlides: 15, prefix: './drake-music/', extension: 'png' }, 'clock': { totalSlides: 1, prefix: './mdf-clock/', extension: 'png' }, rubiks: { totalSlides: 16, prefix: './Rubiks_cube/', extension: 'webp', rotations: { 1: -90, 3: -90, 5: -90 } }, turtle: { totalSlides: 27, prefix: './turtle-cloud/', extension: 'webp' }, helicopter: { totalSlides: 32, prefix: './1dof helicopter/', extension: 'webp', rotations: { 29: -90 } }, violin: { totalSlides: 10, prefix: './violin-bot-player/', extension: 'jpg' }, crs: { totalSlides: 1, prefix: './csr robot/', extension: 'png' }, wjet: { totalSlides: 37, prefix: './wjet/', extension: 'png' } };
    let currentSlide = 1; let currentProjectData = null; let currentPdfBlobUrl = null; let currentPdfOriginalPath = null;

     // --- Publications Data --- (Assumed Correct)
     const publicationsData = [ { title: "1DoF PID Control Helicopter", filePath: "./PID.pdf" }, { title: "MDXaz87Thesis", filePath: "./MDXaz87Thesis.pdf" }, { title: "PhysiBall", filePath: "./physiball/Physiballs handover.pdf" }, { title: "MDF-Mechanical-clock-Development", filePath: "./mdf-clock/Wooden-Clock-Design&Study.pdf" }, { title: "Pneumatics-System-Concepts", filePath: "./pde-industrial-automation/Basic-Concepts-and-Implementation-in-Pneumatic-Automation.pdf" }, { title: "Mechatronics FunBox", filePath: "./FunBox/FunBox-paper.pdf" }, ];

    // --- Utility --- (Unchanged)
     const isElementInViewport = (el) => { /* ... */ };

    // --- Intersection Observer --- (Unchanged)
     const handleIntersection = (entries, observer) => { /* ... */ };
     const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
     const observer = new IntersectionObserver(handleIntersection, observerOptions);
     revealElements.forEach(el => observer.observe(el));

    // --- Modal Functions (with Tracking Integration) --- (Unchanged)
    function openModal(modalElement, contextData = {}) { /* ... */ }
    function closeModal(modalElement) { /* ... */ }

    // --- Slideshow Functions (with Tracking Integration) --- (Unchanged)
    function showSlide(slideNumber) { /* ... */ }
    function nextSlide() { /* ... */ }
    function prevSlide() { /* ... */ }

    // --- Event Listeners --- (Unchanged)
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    [pdfModal, imageModal, publicationsModal, descriptionModal].forEach(modal => { if(modal) modal.addEventListener('click', e => (e.target === modal) && closeModal(modal)); });
    document.querySelectorAll('.project-image[data-project-id]').forEach(element => { element.addEventListener('click', function(event) { /* ... slideshow logic ... */ }); });
    document.querySelectorAll('.project-info h3[data-project-id]').forEach(title => { title.addEventListener('click', function(event) { /* ... description/pdf modal logic ... */ }); });
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    document.addEventListener('keydown', function(e) { /* ... escape/arrow key logic ... */ });

    // --- Hamburger Menu Logic --- (Unchanged)
     if (hamburgerMenu && mobileNavPanel) { hamburgerMenu.addEventListener('click', () => { /* ... */ }); }
     document.querySelectorAll('.mobile-nav-panel a.mobile-nav-link').forEach(link => { link.addEventListener('click', (e) => { /* ... */ }); });

    // --- Publications Modal (with Tracking Integration) --- (Unchanged)
    function populatePublications() { /* ... */ }
    function openPublicationsModal() { /* ... */ }
    if (publicationsLink) { publicationsLink.addEventListener('click', (e) => { e.preventDefault(); openPublicationsModal(); }); }

    // --- Scroll to Top Button (with Tracking) --- (Unchanged)
    if (scrollToTopBtn) { window.addEventListener('scroll', () => { /* ... */ }, { passive: true }); scrollToTopBtn.addEventListener('click', () => { trackEvent('scroll_to_top'); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

    // --- Footer Year --- (Unchanged)
    const yearSpan = document.getElementById('current-year'); if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // --- Image Protection (Basic) --- (Unchanged)
    document.addEventListener('contextmenu', e => { /* ... */ });
    document.addEventListener('dragstart', e => { /* ... */ });

    // --- Feedback Slider Logic --- (Unchanged)
    const feedbackList = document.getElementById('feedback-list'); if (feedbackList) { /* ... */ }

    console.log('Portfolio script fully initialized.');

}); // End DOMContentLoaded
