// --- Simple Analytics Tracker ---
const INGESTION_WORKER_URL = 'https://stats-ingress-worker.azelbane87.workers.dev/'; // <-- Worker URL Integrated

function trackEvent(eventType, eventData = {}) {
    // Basic check to prevent sending if URL is missing (shouldn't happen but safety)
    if (!INGESTION_WORKER_URL || INGESTION_WORKER_URL === 'YOUR_COPIED_INGESTION_WORKER_URL') {
        console.warn('Analytics Ingestion URL not configured. Tracking disabled.');
        return;
    }
    const payload = {
        type: eventType,
        page: window.location.pathname + window.location.search + window.location.hash,
        timestamp: new Date().toISOString(), // Event timestamp (client-side)
        screenWidth: window.screen.width, // Example extra data
        ...eventData // Merge additional specific data
    };

    // Use navigator.sendBeacon if available
    if ((eventType === 'pageview' || eventType === 'link_click') && navigator.sendBeacon) {
         try {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            navigator.sendBeacon(INGESTION_WORKER_URL, blob);
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
        keepalive: true
    })
    .then(response => { /* Optional: Check response for debugging */ })
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

        // --- FIX: Explicitly ignore internal page navigation links ---
        if (href.startsWith('#')) {
            return; // Do nothing for links like #about, #projects etc.
        }
        // --- END FIX ---


        // --- Determine if this click's primary action is handled elsewhere ---
        const isMainNavPubLink = link.id === 'publications-link' || link.id === 'publications-link-mobile';
        const isPubItemLink = link.closest('.publication-item') !== null;
        const isProjectModalTrigger = (event.target.closest('.project-image[data-project-id]') || event.target.closest('h3[data-project-id]'));

        // --- Only track here if NOT handled by specific logic AND not an internal anchor ---
        if (!isMainNavPubLink && !isPubItemLink && !isProjectModalTrigger) {
            let linkType = 'generic_link';
            let context = '';

            const projectCard = link.closest('.project-card');
            if (projectCard) {
                const projElement = projectCard.querySelector('[data-project-id]');
                 if (projElement) context = projElement.getAttribute('data-project-id');
            }

            if (link.closest('.project-links')) linkType = 'project_link';
            if (link.closest('.social-links') || link.closest('.contact-links a[href*="linkedin"]') || link.closest('.contact-links a[href*="github"]')) linkType = 'social_contact_link';
            if (href.includes('github.com') && linkType !== 'social_contact_link') linkType = 'github_link';
            if (href.includes('vimeo.com')) linkType = 'video_platform_link';
            if (href.includes('buymeacoffee.com')) linkType = 'donation_link';
            if (href.endsWith('.mp4')) linkType = 'direct_video_link';
            if (href.endsWith('.pdf')) linkType = 'direct_pdf_link';
            if (link.getAttribute('target') === '_blank') linkType += '_external';

             trackEvent('link_click', {
                url: href,
                text: link.textContent.trim().substring(0, 50),
                type: linkType,
                context: context
             });
        }
    }
 }, false); // Use bubbling phase

console.log('Basic tracker defined. Main script follows.');


// ----------------------------------------------------------------------- //
// --- ORIGINAL SCRIPT.JS CONTENT STARTS HERE (with integrations) ---      //
// ----------------------------------------------------------------------- //

document.addEventListener('DOMContentLoaded', function() {
    // --- Elements ---
    const pdfModal = document.getElementById("pdfModal");
    const pdfViewer = document.getElementById("pdfViewer");
    const imageModal = document.getElementById("imageModal");
    const slideImage = document.getElementById("slideImage");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const slideCounter = document.getElementById("slideCounter");
    const publicationsModal = document.getElementById("publicationsModal");
    const publicationsGrid = document.getElementById("publicationsGrid");
    const publicationsLink = document.getElementById("publications-link");
    const publicationsLinkMobile = document.getElementById("publications-link-mobile");
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const mobileNavPanel = document.getElementById("mobile-nav-panel");
    const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const closeModalBtns = document.querySelectorAll('[data-close-modal]');
    const revealElements = document.querySelectorAll('.reveal');

    // --- Slideshow Data ---
    const slideshowData = {
        'drake-music-project': { totalSlides: 15, prefix: './drake-music/', extension: 'png' },
        'clock':               { totalSlides: 1,  prefix: './mdf-clock/',        extension: 'png' },
        rubiks:     { totalSlides: 16, prefix: './Rubiks_cube/',         extension: 'webp', rotations: { 1: -90, 3: -90, 5: -90 } },
        turtle:     { totalSlides: 27, prefix: './turtle-cloud/',        extension: 'webp' },
        helicopter: { totalSlides: 32, prefix: './1dof helicopter/',     extension: 'webp', rotations: { 29: -90 } },
        violin:     { totalSlides: 10, prefix: './violin-bot-player/',   extension: 'jpg' },
        crs:        { totalSlides: 1,  prefix: './csr robot/',           extension: 'png' },
        wjet:       { totalSlides: 37, prefix: './wjet/',                extension: 'png' }
    };
    let currentSlide = 1;
    let currentProjectData = null; // For active slideshow
    let currentPdfBlobUrl = null;
    let currentPdfOriginalPath = null; // To store original PDF path for tracking context

     // --- Publications Data ---
     const publicationsData = [
        { title: "1DoF PID Control Helicopter", filePath: "./PID.pdf" },
        { title: "MDXaz87Thesis",             filePath: "./MDXaz87Thesis.pdf" },
        { title: "PhysiBall",             filePath: "./physiball/Physiballs handover.pdf" },
        { title: "MDF-Mechanical-clock-Development",             filePath: "./mdf-clock/Wooden-Clock-Design&Study.pdf" },
        { title: "Pneumatics-System-Concepts",             filePath: "./pde-industrial-automation/Basic-Concepts-and-Implementation-in-Pneumatic-Automation.pdf" },
        { title: "Mechatronics FunBox",             filePath: "./FunBox/FunBox-paper.pdf" },
     ];

    // --- Utility ---
     const isElementInViewport = (el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
            rect.bottom >= 0 &&
            rect.right >= 0
        );
    };

    // --- Intersection Observer ---
     const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    };
     const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
     const observer = new IntersectionObserver(handleIntersection, observerOptions);
     revealElements.forEach(el => observer.observe(el));

    // --- Modal Functions (with Tracking Integration) ---
    function openModal(modalElement, contextData = {}) { // Added contextData parameter
         if (!modalElement) return;

         // --- Track Modal Open ---
         let modalType = modalElement.id || 'unknown_modal';
         let modalDetail = '';
         let context = contextData.projectId || '';

         if (modalElement.id === 'imageModal' && currentProjectData) {
             modalType = 'image_modal';
             modalDetail = currentProjectData.prefix;
             context = currentProjectData.prefix.replace(/[.\/]/g, '');
         } else if (modalElement.id === 'pdfModal') {
             modalType = 'pdf_modal';
             modalDetail = currentPdfOriginalPath || pdfViewer.src;
             context = contextData.projectId || contextData.pdfPath || '';
         } else if (modalElement.id === 'publicationsModal') {
             modalType = 'publications_modal';
         }
         trackEvent('modal_open', {
             modalId: modalElement.id,
             modalType: modalType,
             detail: (modalDetail || '').substring(0, 150),
             context: String(context).replace(/[.\/]/g, '')
         });
         // --- End Tracking ---

         modalElement.classList.add('show');
         document.body.style.overflow = 'hidden';
         const focusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
         if (focusable) setTimeout(() => { try { focusable.focus(); } catch(e){} }, 50);
    }

    function closeModal(modalElement) {
        if (!modalElement || !modalElement.classList.contains('show')) return;
         modalElement.style.opacity = '0';
         const content = modalElement.querySelector('.modal-content');
         if (content) content.style.transform = 'scale(0.95)';
         setTimeout(() => {
            modalElement.classList.remove('show');
            document.body.style.overflow = '';
            modalElement.style.opacity = '';
            if (content) content.style.transform = '';
            if (modalElement === pdfModal) {
                pdfViewer.src = 'about:blank';
                if (currentPdfBlobUrl) { URL.revokeObjectURL(currentPdfBlobUrl); currentPdfBlobUrl = null; }
                currentPdfOriginalPath = null; // Clear stored path on close
            }
            if (modalElement === imageModal) {
                currentProjectData = null;
                slideImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                if (slideCounter) slideCounter.style.display = 'block';
                if (prevBtn) prevBtn.style.display = 'block';
                if (nextBtn) nextBtn.style.display = 'block';
            }
         }, 300);
    }

    // --- Slideshow Functions (with Tracking Integration) ---
    function showSlide(slideNumber) {
         if (!currentProjectData || !slideImage || !slideCounter || !prevBtn || !nextBtn) return;
         currentSlide = ((slideNumber - 1 + currentProjectData.totalSlides) % currentProjectData.totalSlides) + 1;
         const imageUrl = `${currentProjectData.prefix}${currentSlide}.${currentProjectData.extension}`;
         slideImage.src = imageUrl;
         slideImage.alt = `Project image ${currentSlide} of ${currentProjectData.totalSlides}`;

         if (currentProjectData.totalSlides === 1) {
             slideCounter.style.display = 'none';
             prevBtn.style.display = 'none';
             nextBtn.style.display = 'none';
         } else {
             slideCounter.textContent = `${currentSlide} / ${currentProjectData.totalSlides}`;
             slideCounter.style.display = 'block';
             prevBtn.style.display = 'block';
             nextBtn.style.display = 'block';
         }
         const rotation = currentProjectData.rotations?.[currentSlide] ?? 0;
         slideImage.style.transform = `rotate(${rotation}deg)`;

         // --- Track Image View ---
         if (imageModal.classList.contains('show')) {
             trackEvent('image_view', {
                 projectId: currentProjectData.prefix.replace(/[.\/]/g, ''),
                 slide: currentSlide,
                 totalSlides: currentProjectData.totalSlides,
                 imageUrl: imageUrl
             });
         }
         // --- End Tracking ---
    }
    function nextSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide + 1); }
    function prevSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide - 1); }

    // --- Event Listeners ---
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    [pdfModal, imageModal, publicationsModal].forEach(modal => {
        if(modal) modal.addEventListener('click', e => (e.target === modal) && closeModal(modal));
    });

    // *** Project Click Handler (Using Original Structure + Tracking) ***
    document.querySelectorAll('[data-project-id]').forEach(element => {
         element.addEventListener('click', function(event) {

            const projectId = this.getAttribute('data-project-id');
            if (!projectId) return;

            // --- Track Project Click Intent ---
            trackEvent('project_click', { projectId: projectId });
            // --- End Tracking ---

            const isTitleClick = this.tagName === 'H3';
            const isImageClick = this.classList.contains('project-image');

            if (projectId === 'clock' && (isTitleClick || isImageClick)) {
                 event.preventDefault();
                 if (slideshowData[projectId] && imageModal) {
                     currentProjectData = slideshowData[projectId];
                     showSlide(1); // Will trigger image_view tracking IF modal opens successfully
                     openModal(imageModal, { projectId: projectId });
                 }
                 return;
            }

            let pdfPath = null;
            if (isTitleClick) { // PDF only on title click
                if (projectId === 'physiball') pdfPath = './physiball/' + encodeURIComponent('Physiballs handover.pdf');
                else if (projectId === 'drake-music-project') pdfPath = './drake-music/drake-music-handover.pdf';
            }

            if (pdfPath) {
                event.preventDefault();
                if (!pdfModal || !pdfViewer) return;
                currentPdfOriginalPath = pdfPath; // Store for tracking context

                pdfViewer.src = 'about:blank';
                if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);

                fetch(pdfPath)
                    .then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); })
                    .then(blob => {
                        currentPdfBlobUrl = URL.createObjectURL(blob);
                        pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0";
                        openModal(pdfModal, { projectId: projectId, pdfPath: pdfPath });
                    }).catch(err => {
                        console.error("PDF Blob Error:", err);
                        pdfViewer.src = pdfPath; // Fallback
                        openModal(pdfModal, { projectId: projectId, pdfPath: pdfPath });
                    });
                return;
            }

            if (slideshowData[projectId] && isImageClick) { // Slideshow only on image click
                event.preventDefault();
                 if (!imageModal) return;
                 currentProjectData = slideshowData[projectId];
                 showSlide(1); // Will trigger image_view tracking IF modal opens successfully
                 openModal(imageModal, { projectId: projectId });
            }
        });
    });
    // *** END Project Click Handler ***

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    document.addEventListener('keydown', function(e) {
         if (e.key === "Escape") [pdfModal, imageModal, publicationsModal].forEach(closeModal);
         if (imageModal?.classList.contains('show')) {
             if (e.key === "ArrowLeft") prevSlide();
             else if (e.key === "ArrowRight") nextSlide();
         }
    });

    // --- Hamburger Menu Logic ---
     if (hamburgerMenu && mobileNavPanel) {
         hamburgerMenu.addEventListener('click', () => {
             const isActive = hamburgerMenu.classList.toggle('active');
             mobileNavPanel.classList.toggle('active');
             document.body.style.overflow = isActive ? 'hidden' : '';
         });
     }
     mobileNavLinks.forEach(link => {
         link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
             // Close menu if open
             if(hamburgerMenu && hamburgerMenu.classList.contains('active')) {
                 hamburgerMenu.classList.remove('active');
                 if(mobileNavPanel) mobileNavPanel.classList.remove('active');
                 document.body.style.overflow = '';
             }
             // Handle specific actions or allow default scroll for # links
             if (link.id === 'publications-link-mobile') {
                  e.preventDefault(); // Prevent default link behavior
                  openPublicationsModal(); // Open the modal
             } else if (href && href.startsWith('#')) {
                 // Allow default scroll behavior for internal links like #about, #projects
                 // No e.preventDefault() needed here
             } else {
                 // Handle other potential mobile links if needed
             }
         });
     });


    // --- Publications Modal (with Tracking Integration) ---
    function populatePublications() {
         if (!publicationsGrid) return;
         publicationsGrid.innerHTML = '';
         if (publicationsData.length === 0) {
             publicationsGrid.innerHTML = '<p>No publications available yet.</p>'; return;
         }
         publicationsData.forEach(pub => {
             const item = document.createElement('div'); item.classList.add('publication-item');
             const link = document.createElement('a');
             link.href = pub.filePath;
             link.textContent = pub.title;
             link.rel = 'noopener noreferrer';

             link.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (!pdfModal || !pdfViewer) return;
                 const pdfPath = link.getAttribute('href');
                 currentPdfOriginalPath = pdfPath; // Store original path

                 // Tracking for the click *intent* might happen via general link tracker;
                 // Tracking for the modal open happens in openModal.

                 pdfViewer.src = 'about:blank';
                 if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);

                 fetch(pdfPath)
                     .then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); })
                     .then(blob => {
                         currentPdfBlobUrl = URL.createObjectURL(blob);
                         pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0";
                         closeModal(publicationsModal); // Close pub list
                         setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath }), 50);
                     }).catch(err => {
                         console.error("PDF Blob Error:", err);
                         pdfViewer.src = pdfPath; // Fallback
                         closeModal(publicationsModal);
                         setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath }), 50);
                     });
             });
             item.appendChild(link);
             publicationsGrid.appendChild(item);
         });
    }
    function openPublicationsModal() {
        if(publicationsModal) {
            populatePublications();
            openModal(publicationsModal); // Tracks the modal open
        }
    }
    if (publicationsLink) { // Desktop link
        publicationsLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default '#' link behavior
            openPublicationsModal();
        });
    }

    // --- Scroll to Top Button (with Tracking) ---
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (scrollToTopBtn) { scrollToTopBtn.classList.toggle('show', window.pageYOffset > 400); }
        }, { passive: true });
        scrollToTopBtn.addEventListener('click', () => {
            trackEvent('scroll_to_top'); // Track the click
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Footer Year ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // --- Image Protection ---
    document.addEventListener('contextmenu', e => (e.target.tagName === 'IMG') && e.preventDefault());
    document.addEventListener('dragstart', e => (e.target.tagName === 'IMG') && e.preventDefault());

    // --- Feedback Slider Logic ---
    const feedbackList = document.getElementById('feedback-list');
    if (feedbackList) {
        const feedbackItems = feedbackList.querySelectorAll('.feedback-item');
        let currentFeedbackIndex = 0;
        const intervalTime = 1500; // Time in milliseconds (e.g., 5 seconds)
        let feedbackInterval;

        function showNextFeedback() {
            if (feedbackItems.length < 2) return; // No need to cycle if less than 2 items

            // Remove 'active' class from current item
            feedbackItems[currentFeedbackIndex].classList.remove('active');

            // Calculate index of the next item, looping back to 0
            currentFeedbackIndex = (currentFeedbackIndex + 1) % feedbackItems.length;

            // Add 'active' class to the new current item
            feedbackItems[currentFeedbackIndex].classList.add('active');
        }

        function startFeedbackSlider() {
            // Ensure interval is clear before starting
            clearInterval(feedbackInterval);
            if (feedbackItems.length > 1) {
                feedbackInterval = setInterval(showNextFeedback, intervalTime);
            }
        }

        function stopFeedbackSlider() {
            clearInterval(feedbackInterval);
        }

        if (feedbackItems.length > 0) {
            // Initially hide all items then show the first one
            feedbackItems.forEach(item => item.classList.remove('active'));
            feedbackItems[0].classList.add('active');

            // Start the slider if there's more than one item
            startFeedbackSlider();

            // Optional: Pause slider on hover
            feedbackList.addEventListener('mouseenter', stopFeedbackSlider);
            feedbackList.addEventListener('mouseleave', startFeedbackSlider);

            console.log('Feedback slider initialized.');
        } else {
            console.log('No feedback items found for slider.');
        }
    }
    // --- End Feedback Slider Logic ---


    console.log('Portfolio script fully initialized.');

}); // End DOMContentLoaded
