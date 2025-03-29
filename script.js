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
        // Title clicks are handled separately now for description modal or specific PDFs
        const isTitleClick = event.target.matches('.project-info h3[data-project-id]') || event.target.closest('.project-info h3[data-project-id]');
        // Image clicks handled separately for slideshow
        const isProjectImageClick = event.target.closest('.project-image[data-project-id]') !== null;


        // --- Only track here if NOT handled by specific logic AND not an internal anchor ---
        // This checks if the click was on a link AND wasn't one of the specific interactive elements handled elsewhere
        if (!isMainNavPubLink && !isPubItemLink && !isTitleClick && !isProjectImageClick) {
            let linkType = 'generic_link';
            let context = '';

            const projectCard = link.closest('.project-card');
            if (projectCard) {
                // Find the h3 within the same card to get the projectId
                const titleElement = projectCard.querySelector('h3[data-project-id]');
                 if (titleElement) context = titleElement.getAttribute('data-project-id');
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
// --- MAIN SCRIPT CONTENT STARTS HERE ---                                 //
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

    // Function to update button state (icons and aria-label)
    const updateButtonState = (theme) => {
        const isLight = theme === 'light';
        if (sunIconDesktop && moonIconDesktop) {
            sunIconDesktop.style.display = isLight ? 'block' : 'none';
            moonIconDesktop.style.display = isLight ? 'none' : 'block';
            themeToggleButton.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
        }
         if (sunIconMobile && moonIconMobile) {
            sunIconMobile.style.display = isLight ? 'block' : 'none';
            moonIconMobile.style.display = isLight ? 'none' : 'block';
            themeToggleButtonMobile.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
        }
    };

    // Function to apply the theme
    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
        }
        updateButtonState(theme);
        try { // Add try...catch for localStorage access
             localStorage.setItem('portfolioTheme', theme);
        } catch (e) {
             console.warn("Could not save theme preference to localStorage:", e);
        }
    };

    // Function to handle the toggle click
    const handleToggleClick = () => {
        const currentThemeIsLight = body.classList.contains('light-theme');
        const newTheme = currentThemeIsLight ? 'dark' : 'light';
        applyTheme(newTheme);
        // Track theme change
        trackEvent('theme_change', { theme: newTheme });
    };

    // Check localStorage on load
    let savedTheme = 'dark'; // Default to dark
    try { // Add try...catch for localStorage access
         savedTheme = localStorage.getItem('portfolioTheme') || 'dark';
    } catch (e) {
         console.warn("Could not read theme preference from localStorage:", e);
    }
    applyTheme(savedTheme); // Apply saved or default theme immediately

    // Add event listeners
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', handleToggleClick);
    }
     if (themeToggleButtonMobile) {
         themeToggleButtonMobile.addEventListener('click', handleToggleClick);
     }
    // --- END: Theme Toggle Logic ---


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
    // *** Description Modal Elements ***
    const descriptionModal = document.getElementById('descriptionModal');
    const modalDescImage = document.getElementById('modalDescImage');
    const modalDescTitle = document.getElementById('modalDescTitle');
    const modalDescText = document.getElementById('modalDescText');
    // *** End Description Modal Elements ***
    const publicationsLink = document.getElementById("publications-link");
    const publicationsLinkMobile = document.getElementById("publications-link-mobile");
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const mobileNavPanel = document.getElementById("mobile-nav-panel");
    const mobileNavLinks = document.querySelectorAll(".mobile-nav-link"); // Excludes the button now
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
        // Add other projects that should have slideshows on IMAGE click here
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
                // Optional: Unobserve after revealed to save resources
                // observer.unobserve(entry.target);
            }
        });
    };
     const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
     const observer = new IntersectionObserver(handleIntersection, observerOptions);
     revealElements.forEach(el => observer.observe(el));

    // --- Modal Functions (with Tracking Integration) ---
    function openModal(modalElement, contextData = {}) {
         if (!modalElement) return;

         // --- Track Modal Open ---
         let modalType = modalElement.id || 'unknown_modal';
         let modalDetail = '';
         let context = contextData.projectId || contextData.pdfPath || ''; // Use projectId or pdfPath as context

         // Refine modal type based on ID
         if (modalElement.id === 'imageModal') modalType = 'image_modal';
         if (modalElement.id === 'pdfModal') modalType = 'pdf_modal';
         if (modalElement.id === 'publicationsModal') modalType = 'publications_modal';
         if (modalElement.id === 'descriptionModal') modalType = 'description_modal'; // NEW

         // Add detail based on modal type
         if (modalType === 'image_modal' && currentProjectData) {
             modalDetail = currentProjectData.prefix;
             context = context || currentProjectData.prefix.replace(/[.\/]/g, ''); // Use prefix if no projectId passed
         } else if (modalType === 'pdf_modal') {
             modalDetail = currentPdfOriginalPath || pdfViewer.src;
             context = context || (currentPdfOriginalPath ? currentPdfOriginalPath.split('/').pop() : ''); // Use filename if no context passed
         } else if (modalType === 'description_modal') {
             modalDetail = modalDescTitle ? modalDescTitle.textContent : '';
             // Context (projectId) should already be set from contextData
         }

         trackEvent('modal_open', {
             modalId: modalElement.id,
             modalType: modalType,
             detail: String(modalDetail).substring(0, 150), // Ensure detail is string
             context: String(context).replace(/[.\/]/g, '') // Ensure context is string & cleaned
         });
         // --- End Tracking ---

         modalElement.classList.add('show');
         document.body.style.overflow = 'hidden';
         // Try focusing the close button first, then any other focusable element
         const focusable = modalElement.querySelector('.close-modal-btn') || modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
         if (focusable) setTimeout(() => { try { focusable.focus(); } catch(e){ console.warn("Focus failed:", e) } }, 50);
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
            // Reset specific modals
            if (modalElement === pdfModal) {
                pdfViewer.src = 'about:blank';
                if (currentPdfBlobUrl) { URL.revokeObjectURL(currentPdfBlobUrl); currentPdfBlobUrl = null; }
                currentPdfOriginalPath = null; // Clear stored path on close
            }
            if (modalElement === imageModal) {
                currentProjectData = null;
                slideImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Blank image
                if (slideCounter) slideCounter.style.display = 'block'; // Reset display
                if (prevBtn) prevBtn.style.display = 'block';
                if (nextBtn) nextBtn.style.display = 'block';
            }
            if (modalElement === descriptionModal) { // Reset description modal content
                 if(modalDescImage) modalDescImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                 if(modalDescTitle) modalDescTitle.textContent = '';
                 if(modalDescText) modalDescText.innerHTML = '';
            }
         }, 300); // Matches CSS transition speed
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
    // Close Modal Button Listener (Applies to all modals with the button)
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    // Close modal on overlay click (Applies to all modals)
    [pdfModal, imageModal, publicationsModal, descriptionModal].forEach(modal => {
        if(modal) modal.addEventListener('click', e => (e.target === modal) && closeModal(modal));
    });

    // *** Project Image Click Handler (for Slideshow ONLY) ***
    document.querySelectorAll('.project-image[data-project-id]').forEach(element => {
         element.addEventListener('click', function(event) {
            const projectId = this.getAttribute('data-project-id');
            // Only proceed if this project is configured for slideshow in slideshowData
            if (!projectId || !slideshowData[projectId]) return;

            // Prevent default if image is wrapped in a link (though it shouldn't be needed now)
            // event.preventDefault();

             // --- Track Project Click Intent (Image for Slideshow) ---
             trackEvent('project_click_image', { projectId: projectId, action: 'open_slideshow' });
             // --- End Tracking ---

            // Open Slideshow Modal
             if (imageModal) {
                 currentProjectData = slideshowData[projectId];
                 showSlide(1); // Will trigger image_view tracking IF modal opens successfully
                 openModal(imageModal, { projectId: projectId });
            } else {
                console.error("Image modal element not found!");
            }
         });
    });
    // *** END Project Image Click Handler ***

    // *** Project Title Click Handler (for Description Modal / Specific PDFs) ***
    document.querySelectorAll('.project-info h3[data-project-id]').forEach(title => {
        const projectId = title.getAttribute('data-project-id');
        const projectCard = title.closest('.project-card');
        // Ensure we have the necessary elements within the card
        const descriptionDiv = projectCard ? projectCard.querySelector('.description') : null;
        const imageElement = projectCard ? projectCard.querySelector('.project-image img') : null;

        title.addEventListener('click', function(event) {
            // --- Track Project Click Intent (Title) ---
            // We track here, then decide which modal/action to take
            trackEvent('project_click_title', { projectId: projectId });
            // --- End Tracking ---

            let pdfPath = null;
            let pdfContext = { projectId: projectId }; // Base context

            // --- Special Case: Specific titles trigger PDF modal ---
            if (projectId === 'physiball') {
                pdfPath = './physiball/' + encodeURIComponent('Physiballs handover.pdf');
                pdfContext.pdfPath = pdfPath; // Add specific path to context
            } //else if (projectId === 'drake-music-project') {
                //pdfPath = './drake-music/drake-music-handover.pdf';
                //pdfContext.pdfPath = pdfPath;
            //}

            // --- Action: Open PDF Modal if path is set ---
            if (pdfPath) {
                event.preventDefault(); // Prevent any default link behavior
                if (!pdfModal || !pdfViewer) {
                    console.error("PDF modal or viewer element not found!");
                    return;
                }
                currentPdfOriginalPath = pdfPath; // Store for tracking detail

                pdfViewer.src = 'about:blank'; // Clear previous content
                if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl); // Release old blob

                fetch(pdfPath)
                    .then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); })
                    .then(blob => {
                        currentPdfBlobUrl = URL.createObjectURL(blob);
                        pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0"; // Load blob URL
                        openModal(pdfModal, pdfContext); // Open modal with context
                    }).catch(err => {
                        console.error("PDF Blob Error:", err);
                        pdfViewer.src = pdfPath; // Fallback to direct path if blob fails
                        openModal(pdfModal, pdfContext); // Open modal with context
                    });
                return; // Stop further processing for this click
            }

            // --- Default Case: Open Description Modal ---
            // Check if required elements exist for the description modal
            if (descriptionDiv && imageElement && descriptionModal && modalDescImage && modalDescTitle && modalDescText) {
                event.preventDefault(); // Prevent default if title is wrapped in a link

                // Get content from the card
                const fullDescriptionHTML = descriptionDiv.innerHTML;
                const projectTitleText = title.textContent;
                const imageSrc = imageElement.src;
                const imageAlt = imageElement.alt || projectTitleText; // Use title as fallback alt text

                // Populate the description modal
                modalDescTitle.textContent = projectTitleText;
                modalDescImage.src = imageSrc;
                modalDescImage.alt = imageAlt;
                modalDescText.innerHTML = fullDescriptionHTML; // Use innerHTML to preserve formatting

                // Open the description modal
                openModal(descriptionModal, { projectId: projectId }); // Pass context

            } else {
                 // This title was clicked, but doesn't trigger PDF and lacks elements for description modal
                 console.warn(`Clicked title for '${projectId}', but required elements for description modal are missing.`);
                 // Allow default browser behavior if the title is, e.g., a link to '#'
            }
        });
    });
    // *** END Project Title Click Handler ***


    // Slideshow Navigation Buttons
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Keyboard Navigation (Escape for all modals, Arrows for slideshow)
    document.addEventListener('keydown', function(e) {
         // Close any open modal on Escape key
         if (e.key === "Escape") {
            [pdfModal, imageModal, publicationsModal, descriptionModal].forEach(modal => {
                if (modal && modal.classList.contains('show')) {
                    closeModal(modal);
                }
            });
         }
         // Slideshow arrow key navigation
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
             // Track menu toggle
             trackEvent('mobile_menu_toggle', { state: isActive ? 'open' : 'close' });
         });
     }
     // Select only actual navigation links within the mobile panel
     document.querySelectorAll('.mobile-nav-panel a.mobile-nav-link').forEach(link => {
         link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
             // Close menu if open, regardless of link type
             if(hamburgerMenu && hamburgerMenu.classList.contains('active')) {
                 hamburgerMenu.classList.remove('active');
                 if(mobileNavPanel) mobileNavPanel.classList.remove('active');
                 document.body.style.overflow = '';
                 // Track menu close via link click
                 trackEvent('mobile_menu_toggle', { state: 'close', trigger: 'link_click' });
             }
             // Handle specific actions (like publications) or allow default scroll for # links
             if (link.id === 'publications-link-mobile') {
                  e.preventDefault(); // Prevent default '#' link behavior
                  openPublicationsModal(); // Open the modal
             } else if (href && href.startsWith('#')) {
                 // Allow default scroll behavior for internal section links like #about, #projects
                 // Tracking for this internal navigation is implicitly handled by page view or scroll events if needed
             } else {
                 // Handle other potential mobile links if needed (e.g., external links)
                 // General link tracking should catch these if they are not handled specially
             }
         });
     });


    // --- Publications Modal (with Tracking Integration) ---
    function populatePublications() {
         if (!publicationsGrid) return;
         publicationsGrid.innerHTML = ''; // Clear previous content
         if (publicationsData.length === 0) {
             publicationsGrid.innerHTML = '<p>No publications available yet.</p>'; return;
         }
         publicationsData.forEach(pub => {
             const item = document.createElement('div'); item.classList.add('publication-item');
             const link = document.createElement('a');
             link.href = pub.filePath;
             link.textContent = pub.title;
             link.rel = 'noopener noreferrer'; // Good practice

             link.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (!pdfModal || !pdfViewer) {
                     console.error("PDF modal or viewer element not found!");
                     return;
                 }
                 const pdfPath = link.getAttribute('href');
                 currentPdfOriginalPath = pdfPath; // Store original path

                 // Track click intent for this specific publication link
                 trackEvent('publication_click', { title: pub.title, path: pdfPath });

                 pdfViewer.src = 'about:blank'; // Clear previous content
                 if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl); // Release old blob

                 fetch(pdfPath)
                     .then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); })
                     .then(blob => {
                         currentPdfBlobUrl = URL.createObjectURL(blob);
                         pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0"; // Load blob URL
                         closeModal(publicationsModal); // Close pub list first
                         // Add a slight delay before opening PDF modal for smoother transition
                         setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath }), 50); // Pass context
                     }).catch(err => {
                         console.error("PDF Blob Error:", err);
                         pdfViewer.src = pdfPath; // Fallback to direct path
                         closeModal(publicationsModal);
                         setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath }), 50); // Pass context
                     });
             });
             item.appendChild(link);
             publicationsGrid.appendChild(item);
         });
    }
    function openPublicationsModal() {
        if(publicationsModal) {
            populatePublications(); // Ensure content is fresh
            openModal(publicationsModal); // Tracks the modal open automatically via openModal function
        } else {
            console.error("Publications modal element not found!");
        }
    }
    // Desktop Publications Link Listener
    if (publicationsLink) {
        publicationsLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default '#' link behavior
            openPublicationsModal();
        });
    }

    // --- Scroll to Top Button (with Tracking) ---
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            // Toggle visibility based on scroll position
            if (scrollToTopBtn) { // Check again inside handler in case it's removed dynamically
                 scrollToTopBtn.classList.toggle('show', window.pageYOffset > 400);
            }
        }, { passive: true }); // Use passive listener for performance
        scrollToTopBtn.addEventListener('click', () => {
            trackEvent('scroll_to_top'); // Track the click event
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Perform smooth scroll
        });
    }

    // --- Footer Year ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear(); // Update year dynamically

    // --- Image Protection (Basic) ---
    document.addEventListener('contextmenu', e => {
        // Prevent right-click menu only on specific images if desired, e.g., inside modals
        if (e.target.tagName === 'IMG' && (e.target.closest('.image-modal') || e.target.closest('.description-modal'))) {
             e.preventDefault();
        }
    });
    document.addEventListener('dragstart', e => {
         // Prevent dragging images
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    // --- Feedback Slider Logic ---
    const feedbackList = document.getElementById('feedback-list');
    if (feedbackList) {
        const feedbackItems = feedbackList.querySelectorAll('.feedback-item');
        let currentFeedbackIndex = 0;
        const intervalTime = 1500; // Time between slides in milliseconds
        let feedbackInterval; // Variable to hold the interval ID

        function showNextFeedback() {
            if (feedbackItems.length < 2) return; // No need to cycle if 0 or 1 item
            feedbackItems[currentFeedbackIndex].classList.remove('active'); // Hide current
            currentFeedbackIndex = (currentFeedbackIndex + 1) % feedbackItems.length; // Move to next index (looping)
            feedbackItems[currentFeedbackIndex].classList.add('active'); // Show next
        }

        function startFeedbackSlider() {
            // Clear any existing interval to prevent duplicates
            clearInterval(feedbackInterval);
            // Start new interval only if there's more than one item
            if (feedbackItems.length > 1) {
                feedbackInterval = setInterval(showNextFeedback, intervalTime);
            }
        }

        function stopFeedbackSlider() {
            clearInterval(feedbackInterval); // Stop the interval
        }

        if (feedbackItems.length > 0) {
            // Initial setup: ensure all are hidden except the first one
            feedbackItems.forEach(item => item.classList.remove('active'));
            feedbackItems[0].classList.add('active'); // Show the first item immediately

            // Start the automatic sliding
            startFeedbackSlider();

            // Optional: Pause the slider when the mouse hovers over the list
            feedbackList.addEventListener('mouseenter', stopFeedbackSlider);
            // Optional: Resume the slider when the mouse leaves the list
            feedbackList.addEventListener('mouseleave', startFeedbackSlider);

            console.log('Feedback slider initialized.');
        } else {
            console.log('No feedback items found for slider.');
        }
    }
    // --- End Feedback Slider Logic ---


    console.log('Portfolio script fully initialized.');

}); // End DOMContentLoaded
