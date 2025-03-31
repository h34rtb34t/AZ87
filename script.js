// --- START OF FILE script.js (Your analytics.js) ---

// --- Simple Analytics Tracker ---
const INGESTION_WORKER_URL = 'https://stats-ingress-worker.azelbane87.workers.dev/'; // <-- Worker URL Integrated

function trackEvent(eventType, eventData = {}) {
    // Basic check to prevent sending if URL is missing (shouldn't happen but safety)
    if (!INGESTION_WORKER_URL || INGESTION_WORKER_URL === 'YOUR_COPIED_INGESTION_WORKER_URL') {
        console.warn('Analytics Ingestion URL not configured. Tracking disabled.');
        return;
    }
    const payload = {
        type: eventType, // Base type from the first argument
        page: window.location.pathname + window.location.search + window.location.hash,
        timestamp: new Date().toISOString(), // Event timestamp (client-side)
        screenWidth: window.screen.width, // Example extra data
        ...eventData // Merge additional specific data (like linkType, url, context etc.)
    };

    // Use navigator.sendBeacon if available for page unload/link clicks
    // Ensure sendBeacon logic is INSIDE trackEvent
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
        // Use fetch for other event types or if sendBeacon is unavailable/fails
        sendWithFetch(payload);
    }
} // <-- This curly brace correctly closes trackEvent

// Define sendWithFetch separately
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
        const isTitleClick = event.target.matches('.project-info h3[data-project-id]') || event.target.closest('.project-info h3[data-project-id]');
        const isProjectImageClick = event.target.closest('.project-image[data-project-id]') !== null;

        // Only track here if NOT handled by specific logic AND not an internal anchor
        if (!isMainNavPubLink && !isPubItemLink && !isTitleClick && !isProjectImageClick) {
            let linkType = 'generic_link'; // Default type
            let context = '';

            const projectCard = link.closest('.project-card');
            if (projectCard) { const titleElement = projectCard.querySelector('h3[data-project-id]'); if (titleElement) context = titleElement.getAttribute('data-project-id'); }

            if (link.closest('.project-links')) linkType = 'project_link';
            if (link.closest('.social-links') || link.closest('.contact-links a[href*="linkedin"]') || link.closest('.contact-links a[href*="github"]')) linkType = 'social_contact_link';
            if (href.includes('github.com') && linkType === 'generic_link') linkType = 'github_link';
            if (href.includes('vimeo.com')) linkType = 'video_platform_link';
            if (href.includes('buymeacoffee.com')) linkType = 'donation_link';
            if (href.endsWith('.mp4')) linkType = 'direct_video_link';
            if (href.endsWith('.pdf')) linkType = 'direct_pdf_link';

             console.log(`Tracking general link click: Type=${linkType}, URL=${href}`);

             // *** Use 'linkType', not 'type' in the eventData object ***
             trackEvent('link_click', {
                url: href,
                text: link.textContent.trim().substring(0, 50),
                linkType: linkType, // <-- CORRECTED PROPERTY NAME
                context: context || undefined
             });
        }
    }
 }, false);

console.log('Basic tracker defined. Main script follows.');


// ----------------------------------------------------------------------- //
// --- MAIN SCRIPT CONTENT STARTS HERE ---                                 //
// (Theme, Modals, Slideshow, Publications, ScrollTop, Footer, Protection, Feedback Slider)
// --- NO CHANGES NEEDED IN THIS SECTION BELOW ---                       //
// ----------------------------------------------------------------------- //

document.addEventListener('DOMContentLoaded', function() {

    // --- START: Theme Toggle Logic ---
    const themeToggleButton = document.getElementById('theme-toggle-btn'); const themeToggleButtonMobile = document.getElementById('theme-toggle-btn-mobile'); const body = document.body; const sunIconDesktop = themeToggleButton?.querySelector('.sun-icon'); const moonIconDesktop = themeToggleButton?.querySelector('.moon-icon'); const sunIconMobile = themeToggleButtonMobile?.querySelector('.sun-icon'); const moonIconMobile = themeToggleButtonMobile?.querySelector('.moon-icon');
    const updateButtonState = (theme) => { const isLight = theme === 'light'; if (sunIconDesktop && moonIconDesktop) { sunIconDesktop.style.display = isLight ? 'block' : 'none'; moonIconDesktop.style.display = isLight ? 'none' : 'block'; themeToggleButton.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme'); } if (sunIconMobile && moonIconMobile) { sunIconMobile.style.display = isLight ? 'block' : 'none'; moonIconMobile.style.display = isLight ? 'none' : 'block'; themeToggleButtonMobile.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme'); } };
    const applyTheme = (theme) => { if (theme === 'light') { body.classList.add('light-theme'); } else { body.classList.remove('light-theme'); } updateButtonState(theme); try { localStorage.setItem('portfolioTheme', theme); } catch (e) { console.warn("Could not save theme preference:", e); } };
    const handleToggleClick = () => { const currentThemeIsLight = body.classList.contains('light-theme'); const newTheme = currentThemeIsLight ? 'dark' : 'light'; applyTheme(newTheme); trackEvent('theme_change', { theme: newTheme }); };
    let savedTheme = 'dark'; try { savedTheme = localStorage.getItem('portfolioTheme') || 'dark'; } catch (e) { console.warn("Could not read theme preference:", e); } applyTheme(savedTheme);
    if (themeToggleButton) { themeToggleButton.addEventListener('click', handleToggleClick); } if (themeToggleButtonMobile) { themeToggleButtonMobile.addEventListener('click', handleToggleClick); }
    // --- END: Theme Toggle Logic ---

    // --- Elements ---
    const pdfModal = document.getElementById("pdfModal"); const pdfViewer = document.getElementById("pdfViewer"); const imageModal = document.getElementById("imageModal"); const slideImage = document.getElementById("slideImage"); const prevBtn = document.getElementById("prevBtn"); const nextBtn = document.getElementById("nextBtn"); const slideCounter = document.getElementById("slideCounter"); const publicationsModal = document.getElementById("publicationsModal"); const publicationsGrid = document.getElementById("publicationsGrid"); const descriptionModal = document.getElementById('descriptionModal'); const modalDescImage = document.getElementById('modalDescImage'); const modalDescTitle = document.getElementById('modalDescTitle'); const modalDescText = document.getElementById('modalDescText'); const publicationsLink = document.getElementById("publications-link"); const publicationsLinkMobile = document.getElementById("publications-link-mobile"); const hamburgerMenu = document.getElementById("hamburger-menu"); const mobileNavPanel = document.getElementById("mobile-nav-panel"); const mobileNavLinks = document.querySelectorAll(".mobile-nav-link"); const scrollToTopBtn = document.getElementById('scrollToTopBtn'); const closeModalBtns = document.querySelectorAll('[data-close-modal]'); const revealElements = document.querySelectorAll('.reveal');
    // --- Slideshow Data ---
    const slideshowData = { 'drake-music-project': { totalSlides: 15, prefix: './drake-music/', extension: 'png' }, 'clock': { totalSlides: 1, prefix: './mdf-clock/', extension: 'png' }, rubiks: { totalSlides: 16, prefix: './Rubiks_cube/', extension: 'webp', rotations: { 1: -90, 3: -90, 5: -90 } }, turtle: { totalSlides: 27, prefix: './turtle-cloud/', extension: 'webp' }, helicopter: { totalSlides: 32, prefix: './1dof helicopter/', extension: 'webp', rotations: { 29: -90 } }, violin: { totalSlides: 10, prefix: './violin-bot-player/', extension: 'jpg' }, crs: { totalSlides: 1, prefix: './csr robot/', extension: 'png' }, wjet: { totalSlides: 37, prefix: './wjet/', extension: 'png' } };
    let currentSlide = 1; let currentProjectData = null; let currentPdfBlobUrl = null; let currentPdfOriginalPath = null;
     // --- Publications Data ---
     const publicationsData = [ { title: "1DoF PID Control Helicopter", filePath: "./PID.pdf" }, { title: "MDXaz87Thesis", filePath: "./MDXaz87Thesis.pdf" }, { title: "PhysiBall", filePath: "./physiball/Physiballs handover.pdf" }, { title: "MDF-Mechanical-clock-Development", filePath: "./mdf-clock/Wooden-Clock-Design&Study.pdf" }, { title: "Pneumatics-System-Concepts", filePath: "./pde-industrial-automation/Basic-Concepts-and-Implementation-in-Pneumatic-Automation.pdf" }, { title: "Mechatronics FunBox", filePath: "./FunBox/FunBox-paper.pdf" }, ];
    // --- Utility ---
     const isElementInViewport = (el) => { if (!el) return false; const rect = el.getBoundingClientRect(); return ( rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth) && rect.bottom >= 0 && rect.right >= 0 ); };
    // --- Intersection Observer ---
     const handleIntersection = (entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); } }); }; const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 }; const observer = new IntersectionObserver(handleIntersection, observerOptions); revealElements.forEach(el => observer.observe(el));
    // --- Modal Functions ---
    function openModal(modalElement, contextData = {}) { if (!modalElement) return; let modalType = modalElement.id || 'unknown_modal'; let modalDetail = ''; let context = contextData.projectId || contextData.pdfPath || ''; if (modalElement.id === 'imageModal') modalType = 'image_modal'; if (modalElement.id === 'pdfModal') modalType = 'pdf_modal'; if (modalElement.id === 'publicationsModal') modalType = 'publications_modal'; if (modalElement.id === 'descriptionModal') modalType = 'description_modal'; if (modalType === 'image_modal' && currentProjectData) { modalDetail = currentProjectData.prefix; context = context || currentProjectData.prefix.replace(/[.\/]/g, ''); } else if (modalType === 'pdf_modal') { modalDetail = currentPdfOriginalPath || pdfViewer.src; context = context || (currentPdfOriginalPath ? currentPdfOriginalPath.split('/').pop() : ''); } else if (modalType === 'description_modal') { modalDetail = modalDescTitle ? modalDescTitle.textContent : ''; } trackEvent('modal_open', { modalId: modalElement.id, modalType: modalType, detail: String(modalDetail).substring(0, 150), context: String(context).replace(/[.\/]/g, '') }); modalElement.classList.add('show'); document.body.style.overflow = 'hidden'; const focusable = modalElement.querySelector('.close-modal-btn') || modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (focusable) setTimeout(() => { try { focusable.focus(); } catch(e){ console.warn("Focus failed:", e) } }, 50); }
    function closeModal(modalElement) { if (!modalElement || !modalElement.classList.contains('show')) return; modalElement.style.opacity = '0'; const content = modalElement.querySelector('.modal-content'); if (content) content.style.transform = 'scale(0.95)'; setTimeout(() => { modalElement.classList.remove('show'); document.body.style.overflow = ''; modalElement.style.opacity = ''; if (content) content.style.transform = ''; if (modalElement === pdfModal) { pdfViewer.src = 'about:blank'; if (currentPdfBlobUrl) { URL.revokeObjectURL(currentPdfBlobUrl); currentPdfBlobUrl = null; } currentPdfOriginalPath = null; } if (modalElement === imageModal) { currentProjectData = null; slideImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; if (slideCounter) slideCounter.style.display = 'block'; if (prevBtn) prevBtn.style.display = 'block'; if (nextBtn) nextBtn.style.display = 'block'; } if (modalElement === descriptionModal) { if(modalDescImage) modalDescImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; if(modalDescTitle) modalDescTitle.textContent = ''; if(modalDescText) modalDescText.innerHTML = ''; } }, 300); }
    // --- Slideshow Functions ---
    function showSlide(slideNumber) { if (!currentProjectData || !slideImage || !slideCounter || !prevBtn || !nextBtn) return; currentSlide = ((slideNumber - 1 + currentProjectData.totalSlides) % currentProjectData.totalSlides) + 1; const imageUrl = `${currentProjectData.prefix}${currentSlide}.${currentProjectData.extension}`; slideImage.src = imageUrl; slideImage.alt = `Project image ${currentSlide} of ${currentProjectData.totalSlides}`; if (currentProjectData.totalSlides === 1) { slideCounter.style.display = 'none'; prevBtn.style.display = 'none'; nextBtn.style.display = 'none'; } else { slideCounter.textContent = `${currentSlide} / ${currentProjectData.totalSlides}`; slideCounter.style.display = 'block'; prevBtn.style.display = 'block'; nextBtn.style.display = 'block'; } const rotation = currentProjectData.rotations?.[currentSlide] ?? 0; slideImage.style.transform = `rotate(${rotation}deg)`; if (imageModal.classList.contains('show')) { trackEvent('image_view', { projectId: currentProjectData.prefix.replace(/[.\/]/g, ''), slide: currentSlide, totalSlides: currentProjectData.totalSlides, imageUrl: imageUrl }); } }
    function nextSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide + 1); } function prevSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide - 1); }
    // --- Event Listeners ---
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal')))); [pdfModal, imageModal, publicationsModal, descriptionModal].forEach(modal => { if(modal) modal.addEventListener('click', e => (e.target === modal) && closeModal(modal)); });
    document.querySelectorAll('.project-image[data-project-id]').forEach(element => { element.addEventListener('click', function(event) { const projectId = this.getAttribute('data-project-id'); if (!projectId || !slideshowData[projectId]) return; trackEvent('project_click_image', { projectId: projectId, action: 'open_slideshow' }); if (imageModal) { currentProjectData = slideshowData[projectId]; showSlide(1); openModal(imageModal, { projectId: projectId }); } else { console.error("Image modal element not found!"); } }); });
    document.querySelectorAll('.project-info h3[data-project-id]').forEach(title => { const projectId = title.getAttribute('data-project-id'); const projectCard = title.closest('.project-card'); const descriptionDiv = projectCard ? projectCard.querySelector('.description') : null; const imageElement = projectCard ? projectCard.querySelector('.project-image img') : null; title.addEventListener('click', function(event) { trackEvent('project_click_title', { projectId: projectId }); let pdfPath = null; let pdfContext = { projectId: projectId }; /* Special PDF cases commented out */ if (pdfPath) { event.preventDefault(); if (!pdfModal || !pdfViewer) { console.error("PDF modal or viewer element not found!"); return; } currentPdfOriginalPath = pdfPath; pdfViewer.src = 'about:blank'; if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl); fetch(pdfPath).then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); }).then(blob => { currentPdfBlobUrl = URL.createObjectURL(blob); pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0"; openModal(pdfModal, pdfContext); }).catch(err => { console.error("PDF Blob Error:", err); pdfViewer.src = pdfPath; openModal(pdfModal, pdfContext); }); return; } if (descriptionDiv && imageElement && descriptionModal && modalDescImage && modalDescTitle && modalDescText) { event.preventDefault(); const fullDescriptionHTML = descriptionDiv.innerHTML; const projectTitleText = title.textContent; const imageSrc = imageElement.src; const imageAlt = imageElement.alt || projectTitleText; modalDescTitle.textContent = projectTitleText; modalDescImage.src = imageSrc; modalDescImage.alt = imageAlt; modalDescText.innerHTML = fullDescriptionHTML; openModal(descriptionModal, { projectId: projectId }); } else { console.warn(`Clicked title for '${projectId}', but required elements for description modal missing.`); } }); });
    if (prevBtn) prevBtn.addEventListener('click', prevSlide); if (nextBtn) nextBtn.addEventListener('click', nextSlide); document.addEventListener('keydown', function(e) { if (e.key === "Escape") { [pdfModal, imageModal, publicationsModal, descriptionModal].forEach(modal => { if (modal && modal.classList.contains('show')) { closeModal(modal); } }); } if (imageModal?.classList.contains('show')) { if (e.key === "ArrowLeft") prevSlide(); else if (e.key === "ArrowRight") nextSlide(); } });
    // --- Hamburger Menu Logic ---
     if (hamburgerMenu && mobileNavPanel) { hamburgerMenu.addEventListener('click', () => { const isActive = hamburgerMenu.classList.toggle('active'); mobileNavPanel.classList.toggle('active'); document.body.style.overflow = isActive ? 'hidden' : ''; trackEvent('mobile_menu_toggle', { state: isActive ? 'open' : 'close' }); }); } document.querySelectorAll('.mobile-nav-panel a.mobile-nav-link').forEach(link => { link.addEventListener('click', (e) => { const href = link.getAttribute('href'); if(hamburgerMenu && hamburgerMenu.classList.contains('active')) { hamburgerMenu.classList.remove('active'); if(mobileNavPanel) mobileNavPanel.classList.remove('active'); document.body.style.overflow = ''; trackEvent('mobile_menu_toggle', { state: 'close', trigger: 'link_click' }); } if (link.id === 'publications-link-mobile') { e.preventDefault(); openPublicationsModal(); } else if (href && href.startsWith('#')) { /* Allow default scroll */ } }); });
    // --- Publications Modal ---
    function populatePublications() { if (!publicationsGrid) return; publicationsGrid.innerHTML = ''; if (publicationsData.length === 0) { publicationsGrid.innerHTML = '<p>No publications available yet.</p>'; return; } publicationsData.forEach(pub => { const item = document.createElement('div'); item.classList.add('publication-item'); const link = document.createElement('a'); link.href = pub.filePath; link.textContent = pub.title; link.rel = 'noopener noreferrer'; link.addEventListener('click', (e) => { e.preventDefault(); if (!pdfModal || !pdfViewer) { console.error("PDF modal or viewer element not found!"); return; } const pdfPath = link.getAttribute('href'); currentPdfOriginalPath = pdfPath; trackEvent('publication_click', { title: pub.title, path: pdfPath }); pdfViewer.src = 'about:blank'; if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl); fetch(pdfPath).then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); }).then(blob => { currentPdfBlobUrl = URL.createObjectURL(blob); pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0"; closeModal(publicationsModal); setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath }), 50); }).catch(err => { console.error("PDF Blob Error:", err); pdfViewer.src = pdfPath; closeModal(publicationsModal); setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath }), 50); }); }); item.appendChild(link); publicationsGrid.appendChild(item); }); }
    function openPublicationsModal() { if(publicationsModal) { populatePublications(); openModal(publicationsModal); } else { console.error("Publications modal element not found!"); } } if (publicationsLink) { publicationsLink.addEventListener('click', (e) => { e.preventDefault(); openPublicationsModal(); }); }
    // --- Scroll to Top Button ---
    if (scrollToTopBtn) { window.addEventListener('scroll', () => { if (scrollToTopBtn) { scrollToTopBtn.classList.toggle('show', window.pageYOffset > 400); } }, { passive: true }); scrollToTopBtn.addEventListener('click', () => { trackEvent('scroll_to_top'); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
    // --- Footer Year ---
    const yearSpan = document.getElementById('current-year'); if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    // --- Image Protection ---
    document.addEventListener('contextmenu', e => { if (e.target.tagName === 'IMG' && (e.target.closest('.image-modal') || e.target.closest('.description-modal'))) { e.preventDefault(); } }); document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') { e.preventDefault(); } });
    // --- Feedback Slider Logic ---
    const feedbackList = document.getElementById('feedback-list'); if (feedbackList) { const feedbackItems = feedbackList.querySelectorAll('.feedback-item'); let currentFeedbackIndex = 0; const intervalTime = 1500; let feedbackInterval; function showNextFeedback() { if (feedbackItems.length < 2) return; feedbackItems[currentFeedbackIndex].classList.remove('active'); currentFeedbackIndex = (currentFeedbackIndex + 1) % feedbackItems.length; feedbackItems[currentFeedbackIndex].classList.add('active'); } function startFeedbackSlider() { clearInterval(feedbackInterval); if (feedbackItems.length > 1) { feedbackInterval = setInterval(showNextFeedback, intervalTime); } } function stopFeedbackSlider() { clearInterval(feedbackInterval); } if (feedbackItems.length > 0) { feedbackItems.forEach(item => item.classList.remove('active')); feedbackItems[0].classList.add('active'); startFeedbackSlider(); feedbackList.addEventListener('mouseenter', stopFeedbackSlider); feedbackList.addEventListener('mouseleave', startFeedbackSlider); console.log('Feedback slider initialized.'); } else { console.log('No feedback items found for slider.'); } }

    console.log('Portfolio script fully initialized.');

}); // End DOMContentLoaded

// --- END OF FILE script.js ---
