// --- Simple Analytics Tracker ---
const INGESTION_WORKER_URL = 'https://stats-ingress-worker.azelbane87.workers.dev/'; // <-- Worker URL Integrated

function trackEvent(eventType, eventData = {}) {
    const payload = {
        type: eventType,
        page: window.location.pathname + window.location.search + window.location.hash,
        timestamp: new Date().toISOString(), // Event timestamp (client-side)
        screenWidth: window.screen.width, // Example extra data
        ...eventData // Merge additional specific data
    };

    // Use navigator.sendBeacon if available (more reliable for sending data on page unload)
    // Fallback to fetch for other events
    if ((eventType === 'pageview' || eventType === 'link_click') && navigator.sendBeacon) {
         try {
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            const success = navigator.sendBeacon(INGESTION_WORKER_URL, blob);
         } catch (e) {
            console.error('Beacon error (might be normal on unload):', e);
         }
    } else {
        sendWithFetch(payload);
    }
}

function sendWithFetch(payload) {
     fetch(INGESTION_WORKER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true // Important for fetch requests potentially happening during page unload
    })
    .then(response => {
        // Optional: Debugging
        // if (!response.ok) console.error('Tracking fetch failed:', response.status, payload);
        // else console.log('Tracked (fetch):', payload);
    })
    .catch(error => {
        console.error('Error sending tracking data (fetch):', error, payload);
    });
}

// --- Track Page View ---
document.addEventListener('DOMContentLoaded', () => {
    trackEvent('pageview');
});

 // --- Track Link Clicks (General Listener) ---
 // Tracks clicks on various links.
 document.addEventListener('click', function(event) {
    const link = event.target.closest('a'); // Find the nearest ancestor anchor tag

    if (link && link.href) { // Check if it's a link with an href
        const href = link.getAttribute('href');
        let linkType = 'generic_link';
        let context = ''; // e.g., project ID if inside a project card

        const projectCard = link.closest('.project-card');
        if (projectCard) {
            // Try finding the data-project-id on the card or elements within it
            const projH3 = projectCard.querySelector('h3[data-project-id]');
            const projImg = projectCard.querySelector('.project-image[data-project-id]');
             if (projH3) context = projH3.getAttribute('data-project-id');
             else if (projImg) context = projImg.getAttribute('data-project-id');
        }

        // Determine link type more specifically
        if (link.closest('.project-links')) linkType = 'project_link';
        if (link.closest('.publication-item')) linkType = 'publication_link';
        if (link.closest('.social-links') || link.closest('.contact-links a[href*="linkedin"]') || link.closest('.contact-links a[href*="github"]')) linkType = 'social_contact_link';
        if (link.href.includes('github.com')) linkType = 'github_link';
        if (link.href.includes('vimeo.com')) linkType = 'video_platform_link';
        if (link.href.includes('buymeacoffee.com')) linkType = 'donation_link';
        if (link.href.endsWith('.mp4')) linkType = 'direct_video_link';
        if (link.href.endsWith('.pdf')) linkType = 'direct_pdf_link';
        if (link.getAttribute('target') === '_blank') linkType += '_external';


        // Check if this click's *primary* purpose is handled by other specific trackers
        // (like opening a project modal via image/title, or the main publications link)
        // Find if the clicked element OR its parent link is a known modal trigger for projects
         const closestProjectTrigger = event.target.closest('.project-image[data-project-id], h3[data-project-id]');
         const isProjectModalTriggerClick = closestProjectTrigger !== null;

        // Check if it's the main publications link in nav
        const isMainNavPubLink = link.id === 'publications-link' || link.id === 'publications-link-mobile';

        // Only track here if it's NOT a click handled by project_click or modal_open (publications)
        if (!isProjectModalTriggerClick && !isMainNavPubLink) {
             trackEvent('link_click', {
                url: href,
                text: link.textContent.trim().substring(0, 50),
                type: linkType,
                context: context
             });
        }
    }
 }, true); // Use capture phase

console.log('Basic tracker defined. Integration follows within DOMContentLoaded.');


// --- MAIN APPLICATION LOGIC ---
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
        // Note: pde-automation and salamander-bot don't have slideshow data defined
    };
    let currentSlide = 1;
    let currentProjectData = null; // Holds data for the *currently open* slideshow
    let currentPdfBlobUrl = null;
    let currentPdfOriginalPath = null; // Variable to store the original PDF path

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
                 // Optional: Track section visibility
                 if (entry.target.tagName === 'SECTION' && entry.target.id) {
                    // Debounce or track only once per session if needed
                    // trackEvent('section_view', { sectionId: entry.target.id });
                 }
            }
        });
    };
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    revealElements.forEach(el => observer.observe(el));

    // --- Modal Functions ---
    function openModal(modalElement, contextData = {}) { // Added contextData
         if (!modalElement) return;

         // <<< INTEGRATION: Track Modal Open >>>
         let modalType = modalElement.id || 'unknown_modal';
         let modalDetail = '';
         let context = contextData.projectId || ''; // Use passed project ID if available

         if (modalElement.id === 'imageModal' && currentProjectData) { // currentProjectData is set *before* calling openModal for images
             modalType = 'image_modal';
             modalDetail = currentProjectData.prefix;
             context = currentProjectData.prefix.replace(/[.\/]/g, ''); // Use project prefix as context
         } else if (modalElement.id === 'pdfModal') {
             modalType = 'pdf_modal';
             // Use the original PDF path stored when the link was clicked
             modalDetail = currentPdfOriginalPath || pdfViewer.src;
         } else if (modalElement.id === 'publicationsModal') {
             modalType = 'publications_modal';
         }
         trackEvent('modal_open', {
             modalId: modalElement.id,
             modalType: modalType,
             detail: (modalDetail || '').substring(0, 150), // Limit detail length
             context: context
         });
         // <<< END TRACKING >>>

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
                currentPdfOriginalPath = null; // Clear stored path
            }
            if (modalElement === imageModal) {
                currentProjectData = null; // Clear slideshow data
                slideImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                if (slideCounter) slideCounter.style.display = 'block';
                if (prevBtn) prevBtn.style.display = 'block';
                if (nextBtn) nextBtn.style.display = 'block';
            }
         }, 300);
    }

    // --- Slideshow Functions ---
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

         // <<< INTEGRATION: Track Image View >>>
         // Only track if the modal is actually visible (avoids tracking initial load)
         if (imageModal.classList.contains('show')) {
             trackEvent('image_view', {
                 projectId: currentProjectData.prefix.replace(/[.\/]/g, ''), // Cleaned project ID
                 slide: currentSlide,
                 totalSlides: currentProjectData.totalSlides,
                 imageUrl: imageUrl // Store the specific image URL viewed
             });
         }
         // <<< END TRACKING >>>
    }
    function nextSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide + 1); }
    function prevSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide - 1); }

    // --- Event Listeners ---
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    [pdfModal, imageModal, publicationsModal].forEach(modal => {
        if(modal) modal.addEventListener('click', e => (e.target === modal) && closeModal(modal));
    });

    // *** Project Click Handler (Revised for Tracking) ***
    document.querySelectorAll('[data-project-id]').forEach(element => {
        // Attach listener specifically to the elements that trigger actions (image or title)
        const imgTrigger = element.querySelector('.project-image');
        const titleTrigger = element.querySelector('h3'); // Assuming h3 has data-project-id

        const projectId = element.getAttribute('data-project-id') || (titleTrigger ? titleTrigger.getAttribute('data-project-id') : null) || (imgTrigger ? imgTrigger.getAttribute('data-project-id') : 'unknown');

        const handleProjectClick = function(event) {
            // <<< INTEGRATION: Track Project Click >>>
            // Track the intent to interact with the project
             trackEvent('project_click', { projectId: projectId });
            // <<< END TRACKING >>>

            const isTitleClick = event.target.tagName === 'H3';
            const isImageClick = event.target.closest('.project-image') !== null;

            // --- Original Logic (slightly adjusted) ---
            if (projectId === 'clock' && (isTitleClick || isImageClick)) {
                 event.preventDefault();
                 if (slideshowData[projectId] && imageModal) {
                     currentProjectData = slideshowData[projectId]; // Set data *before* opening modal
                     showSlide(1); // Prepare first slide
                     openModal(imageModal, { projectId: projectId }); // Pass context
                 }
                 return;
            }

            let pdfPath = null;
            if (isTitleClick) { // Only trigger PDF on title click based on original logic
                if (projectId === 'physiball') {
                    pdfPath = './physiball/' + encodeURIComponent('Physiballs handover.pdf');
                } else if (projectId === 'drake-music-project') {
                    pdfPath = './drake-music/drake-music-handover.pdf';
                }
            }

            if (pdfPath) {
                event.preventDefault();
                if (!pdfModal || !pdfViewer) return;

                currentPdfOriginalPath = pdfPath; // Store the original path before fetch
                pdfViewer.src = 'about:blank';
                if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);

                fetch(pdfPath)
                    .then(response => {
                        if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`);
                        return response.blob();
                    })
                    .then(blob => {
                        currentPdfBlobUrl = URL.createObjectURL(blob);
                        pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0";
                        openModal(pdfModal, { projectId: projectId }); // Pass context
                    }).catch(err => {
                        console.error("PDF Blob Error:", err);
                        pdfViewer.src = pdfPath; // Fallback
                        openModal(pdfModal, { projectId: projectId }); // Pass context
                    });
                return;
            }

            if (slideshowData[projectId] && isImageClick) { // Slideshow only on image click
                event.preventDefault();
                 if (!imageModal) return;
                 currentProjectData = slideshowData[projectId]; // Set data *before* opening modal
                 showSlide(1); // Prepare first slide (will trigger image_view tracking)
                 openModal(imageModal, { projectId: projectId }); // Pass context
            }
            // No default action if it's not PDF or Slideshow (e.g., PDE/Salamander image click won't open modal)
        };

        // Add listener to triggers
        if (imgTrigger) imgTrigger.addEventListener('click', handleProjectClick);
        if (titleTrigger) titleTrigger.addEventListener('click', handleProjectClick);

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

    // Hamburger Menu
     if (hamburgerMenu && mobileNavPanel) {
         hamburgerMenu.addEventListener('click', () => {
             const isActive = hamburgerMenu.classList.toggle('active');
             mobileNavPanel.classList.toggle('active');
             document.body.style.overflow = isActive ? 'hidden' : '';
         });
     }
     mobileNavLinks.forEach(link => {
         link.addEventListener('click', (e) => {
             if(hamburgerMenu && hamburgerMenu.classList.contains('active')) {
                 hamburgerMenu.classList.remove('active');
                 if(mobileNavPanel) mobileNavPanel.classList.remove('active');
                 document.body.style.overflow = '';
             }
             if (link.id === 'publications-link-mobile') {
                  e.preventDefault();
                  openPublicationsModal(); // Will trigger modal_open tracking
             }
         });
     });


    // Publications Modal
    function populatePublications() {
         if (!publicationsGrid) return;
         publicationsGrid.innerHTML = '';
         if (publicationsData.length === 0) {
             publicationsGrid.innerHTML = '<p>No publications available yet.</p>'; return;
         }
         publicationsData.forEach(pub => {
             const item = document.createElement('div'); item.classList.add('publication-item');
             const link = document.createElement('a'); link.href = pub.filePath; link.textContent = pub.title; /*link.target = '_blank';*/ link.rel = 'noopener noreferrer'; // Remove target blank

             // Modify publication link click to open PDF modal AND track
             link.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (!pdfModal || !pdfViewer) return;

                 const pdfPath = link.getAttribute('href');
                 currentPdfOriginalPath = pdfPath; // Store original path for tracking

                 // Note: General link tracker might fire here too, check dashboard data
                 // trackEvent('publication_pdf_click', { pdfPath: pdfPath, title: pub.title }); // Optional more specific tracking

                 pdfViewer.src = 'about:blank';
                 if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);

                 fetch(pdfPath)
                     .then(response => {
                         if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`);
                         return response.blob();
                     })
                     .then(blob => {
                         currentPdfBlobUrl = URL.createObjectURL(blob);
                         pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0";
                         closeModal(publicationsModal); // Close pub list
                         setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath }), 50); // Open PDF modal, pass context
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
            openModal(publicationsModal); // Will trigger modal_open tracking
        }
    }
    if (publicationsLink) {
        publicationsLink.addEventListener('click', (e) => {
            e.preventDefault();
            // trackEvent('publications_link_click'); // Optional specific tracking
            openPublicationsModal();
        });
    }

    // Scroll to Top Button
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (scrollToTopBtn) { scrollToTopBtn.classList.toggle('show', window.pageYOffset > 400); }
        }, { passive: true });
        scrollToTopBtn.addEventListener('click', () => {
            trackEvent('scroll_to_top'); // Track scroll to top click
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Footer Year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Image Protection
    document.addEventListener('contextmenu', e => (e.target.tagName === 'IMG') && e.preventDefault());
    document.addEventListener('dragstart', e => (e.target.tagName === 'IMG') && e.preventDefault());

    console.log('Main portfolio script initialized.');

}); // End DOMContentLoaded
