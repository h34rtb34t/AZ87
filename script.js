// --- START OF FILE script.js (Integrated Tracker - FOR PORTFOLIO) ---

// ----------------------------------------------------------------------- //
// --- NEW Portfolio Analytics Tracker (Based on tracker.js example) ---   //
// ----------------------------------------------------------------------- //
(function() {
    // --- Configuration ---
    // IMPORTANT: Replace with the URL of your DEPLOYED logging-worker
    const LOGGING_WORKER_URL = 'https://stats-ingress-worker.azelbane87.workers.dev/'; // <<<<<------ SET THIS ******
    // Optional: Add a simple secret if you want basic verification on the logging worker
    // const TRACKING_SECRET = 'your_optional_simple_secret';

    // Debounce function (optional - keep if you think you might need it later)
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
     }

    // --- Core Event Sending Function ---
    function sendEvent(eventType, eventDetails = {}) {
        if (!LOGGING_WORKER_URL || LOGGING_WORKER_URL.includes('YOUR_LOGGING_WORKER_SUBDOMAIN')) { // Added check for placeholder
            console.warn("Logging worker URL not configured correctly in script.js. Tracking disabled.", LOGGING_WORKER_URL);
            return;
        }

        // Add projectId/context from details if missing at top level (for consistency in KV)
        const detailsProjectId = eventDetails.projectId || eventDetails.context || eventDetails.trackId || null;

        const payload = {
            type: eventType,
            timestamp: new Date().toISOString(), // Client-side timestamp
            page: window.location.href, // Use full URL
            screenWidth: window.innerWidth, // Use innerWidth (more common for layout)
            screenHeight: window.innerHeight,
            referrer: document.referrer, // Where the user came from
            projectId: detailsProjectId, // Hoist projectId/context if available in details
            details: eventDetails // Keep the full details object
        };

        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

        try {
            // Optional: Add secret header if using one
            // if (TRACKING_SECRET) {
            //    navigator.sendBeacon(LOGGING_WORKER_URL, blob, { 'X-Tracking-Secret': TRACKING_SECRET });
            // } else {
               navigator.sendBeacon(LOGGING_WORKER_URL, blob); // Use sendBeacon for reliability
            // }
            // console.log('Beacon sent:', payload.type, payload.projectId || '', payload.details.targetElement || '', payload.details.href || ''); // Debugging
        } catch (error) {
            console.error('Error sending tracking beacon:', error);
            // Fallback or alternative logging method if needed
            fetch(LOGGING_WORKER_URL, { method: 'POST', body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'}, keepalive: true })
             .catch(fetchErr => console.error('Tracking fetch fallback error:', fetchErr));
        }
    }

    // --- Event Listeners ---

    // 1. Page View Tracking
    // Send immediately on script load (approximates page view)
    // No need for DOMContentLoaded here, as it runs when the script file loads
    sendEvent('pageview');

    // 2. Click Tracking (using event delegation)
    // This will capture ALL clicks on the body and analyze the target
    document.body.addEventListener('click', function(event) {
        const element = event.target;

        // --- Element Identification ---
        // Find the nearest relevant interactive ancestor
        const link = element.closest('a');
        const button = element.closest('button');
        // Add specific identifiable elements if needed (e.g., project cards)
        const projectCard = element.closest('.project-card');
        const trackedElement = element.closest('[data-track-id]'); // Explicit tracking points
        const publicationItemLink = element.closest('.publication-item a'); // Specific handling for these links
        const projectImage = element.closest('.project-image[data-project-id]'); // Specific image clicks
        const projectTitle = element.closest('.project-info h3[data-project-id]'); // Specific title clicks
        const themeToggle = element.closest('#theme-toggle-btn, #theme-toggle-btn-mobile'); // Theme toggles
        const scrollToTop = element.closest('#scrollToTopBtn'); // Scroll to top
        const hamburger = element.closest('#hamburger-menu'); // Hamburger toggle
        const mobileNavLink = element.closest('.mobile-nav-panel a.mobile-nav-link'); // Links inside mobile nav
        const modalCloseBtn = element.closest('[data-close-modal]'); // Modal close buttons

        // --- Determine Context (e.g., Project ID) ---
        let contextProjectId = null;
        if (projectCard) {
            // Use the data-project-id from the card itself if present
            contextProjectId = projectCard.getAttribute('data-project-id');
             // Fallback to finding title inside if card itself doesn't have the ID (though it should now)
            if (!contextProjectId) {
                 const cardTitle = projectCard.querySelector('h3[data-project-id]');
                 if (cardTitle) contextProjectId = cardTitle.getAttribute('data-project-id');
            }
        } else if (trackedElement) {
            contextProjectId = trackedElement.getAttribute('data-project-id') || trackedElement.getAttribute('data-context') || contextProjectId;
        } else if (projectImage) {
            contextProjectId = projectImage.getAttribute('data-project-id');
        } else if (projectTitle) {
             contextProjectId = projectTitle.getAttribute('data-project-id');
        }
        // Note: contextProjectId might still be null here if the click wasn't within a project context

        // --- Event Type and Details Logic ---
        let eventType = 'generic_click'; // Default if nothing specific matches
        let details = {
            targetElement: element.tagName,
            targetId: element.id || null,
            targetClasses: element.className || null,
            // Add contextProjectId if found
            ...(contextProjectId && { projectId: contextProjectId })
        };
        let shouldTrack = true; // Flag to decide if this generic click tracker should log the event

        // --- Handle Specific Click Cases FIRST (to avoid double-tracking) ---
        // These cases are likely handled by MORE SPECIFIC listeners elsewhere in the code
        // OR we want to assign a VERY specific event type here.

        if (projectImage) {
            // Handled by the specific project image click listener below if it's opening slideshow
            shouldTrack = false; // Don't track generically, rely on dedicated handler
        } else if (projectTitle) {
            // Handled by the specific project title click listener below
            shouldTrack = false; // Don't track generically, rely on dedicated handler
        } else if (publicationItemLink) {
            // Handled by the specific publication link listener below
             shouldTrack = false; // Don't track generically, rely on dedicated handler
        } else if (themeToggle || scrollToTop || hamburger || mobileNavLink || modalCloseBtn) {
             // These have dedicated tracking calls within their specific handlers below
             shouldTrack = false;
        } else if (link) {
            // This is a link click NOT handled by the specific cases above
            details.href = link.getAttribute('href'); // Use getAttribute to get the raw value
            details.linkText = link.textContent?.trim().substring(0, 100); // Limit text length

            if (details.href) {
                if (details.href.startsWith('#')) {
                    eventType = 'anchor_click';
                    details.linkType = 'anchor';
                    // Note: If it's the publications link, it will be handled by specific listeners below
                    if (link.id === 'publications-link' || link.id === 'publications-link-mobile') {
                        shouldTrack = false; // Prevent double tracking
                    }
                } else {
                    eventType = 'link_click'; // External or internal page link
                    if (link.hostname === window.location.hostname || details.href.startsWith('/') || details.href.startsWith('.')) { // Added '.' for relative internal links
                         details.linkType = 'internal';
                    } else {
                         details.linkType = 'external';
                    }
                    // Add more specific link types based on your old logic if needed
                    if (link.closest('.project-links')) details.linkTypeDetail = 'project_link';
                    if (link.closest('.social-links') || link.closest('.contact-links a[href*="linkedin"]') || link.closest('.contact-links a[href*="github"]')) details.linkTypeDetail = 'social_contact_link';
                    if (details.href.includes('vimeo.com')) details.linkTypeDetail = 'video_platform_link';
                    if (details.href.includes('buymeacoffee.com')) details.linkTypeDetail = 'donation_link';
                    if (details.href.endsWith('.mp4')) details.linkTypeDetail = 'direct_video_link';
                    if (details.href.endsWith('.pdf')) details.linkTypeDetail = 'direct_pdf_link';
                     // Add target blank check
                     if (link.getAttribute('target') === '_blank') details.targetBlank = true;

                }
            } else {
                 eventType = 'link_click'; // Link without href
                 details.linkType = 'nohref';
            }
            // If contextProjectId was found earlier, it's already in details
             if (!details.projectId && trackedElement) { // Add trackId if link is inside a tracked element
                 details.trackId = trackedElement.getAttribute('data-track-id');
             }

        } else if (button) {
            // A button was clicked that isn't handled by specific cases
            eventType = 'button_click';
            details.buttonText = button.textContent?.trim().substring(0, 100);
            details.buttonId = button.id || null;
            details.buttonClasses = button.className || null;
             // If contextProjectId was found earlier, it's already in details
             if (!details.projectId && trackedElement) { // Add trackId if button is inside a tracked element
                 details.trackId = trackedElement.getAttribute('data-track-id');
             }

        } else if (trackedElement) {
            // Clicked directly on or inside an element with data-track-id, but wasn't a link/button/handled case
            eventType = trackedElement.getAttribute('data-track-event-type') || 'tracked_element_click'; // Allow custom event type
            details.trackId = trackedElement.getAttribute('data-track-id');
            // projectId/context should already be in details if found via context logic above
        } else if (projectCard) {
             // Clicked inside a project card, but not on image/title/link/button/tracked element
             // Assign a specific type or keep as generic_click with projectId
             eventType = 'project_card_area_click'; // Example specific type
             // projectId is already added to details if found
        }
        // --- Add more specific 'else if' cases here if needed ---


        // --- Send the Event (if not handled specifically elsewhere) ---
        if (shouldTrack) {
            sendEvent(eventType, details);
        }

    }, true); // Use CAPTURE phase (true) - usually ok, can switch to false (bubbling) if needed

    // --- Public API ---
    // Expose functions to be called from the rest of your script
    window.portfolioTracker = {
        trackEvent: sendEvent, // General purpose tracking
        // Specific helpers matching the old tracker.js example
        trackModalOpen: (modalId, context = {}) => {
            // Ensure context is an object, extract relevant fields
            let detail = context.detail || context.pdfPath || (context.projectId ? `Project: ${context.projectId}` : '');
            let projectId = context.projectId || null;
             // If projectId wasn't explicitly passed, try to infer from detail if it looks like a filename/path
             if (!projectId && typeof context.detail === 'string' && context.detail.includes('/')) {
                 projectId = context.detail.split('/').pop().split('.')[0]; // Basic inference from path
             }
            if (!projectId && typeof context.context === 'string' && context.context.length > 0) {
                 projectId = context.context; // Use context.context if projectId missing
            }

            sendEvent('modal_open', { modalId: modalId, detail: String(detail).substring(0,150), projectId: projectId });
        },
        trackImageView: (imageSrc, context = {}) => {
             // Ensure context is an object
             let projectId = context.projectId || null;
              if (!projectId && typeof context.context === 'string' && context.context.length > 0) {
                  projectId = context.context; // Use context.context if projectId missing
              }
              // Infer projectId from imageSrc if missing
               if (!projectId && typeof imageSrc === 'string' && imageSrc.includes('/')) {
                   // Try to extract from path, e.g. './project-name/' -> 'project-name'
                   const pathParts = imageSrc.split('/');
                   if (pathParts.length > 2) { // e.g., ['.', 'project-name', '1.jpg']
                       projectId = pathParts[pathParts.length - 2];
                   }
               }


             sendEvent('image_view', {
                 imageSrc: String(imageSrc).substring(0, 200), // Limit src length
                 slide: context.slide || null,
                 totalSlides: context.totalSlides || null,
                 projectId: projectId
                });
        }
        // Add other specific tracking functions if needed (e.g., trackFormSubmit)
    };

    console.log("Portfolio tracker initialized.");

})(); // End of Tracker IIFE

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
        // --- Use new tracker ---
        if (window.portfolioTracker) {
             window.portfolioTracker.trackEvent('theme_change', { theme: newTheme });
        }
        // --- End Use new tracker ---
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
    const contactForm = document.querySelector('.contact-form form'); // Reference contact form
    const feedbackForm = document.querySelector('.feedback-form'); // Reference feedback form

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
                 // Optional: Track element reveal
                 if (window.portfolioTracker) {
                     let trackId = entry.target.dataset.projectId || entry.target.dataset.trackId || entry.target.id || entry.target.tagName;
                     window.portfolioTracker.trackEvent('element_reveal', { elementId: trackId });
                 }
                // Optional: Unobserve after revealed to save resources
                 observer.unobserve(entry.target);
            }
        });
    };
     const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
     const observer = new IntersectionObserver(handleIntersection, observerOptions);
     revealElements.forEach(el => observer.observe(el));

    // --- Modal Functions ---
    // --- MODIFY openModal to use new tracker ---
    function openModal(modalElement, contextData = {}) {
         if (!modalElement) return;

         // --- Track Modal Open (using new tracker helper) ---
         if (window.portfolioTracker) {
            // Prepare context for the tracker function
            let trackerContext = {};
            let modalId = modalElement.id || 'unknown_modal';

             // Extract project ID or other relevant context
             if (contextData.projectId) trackerContext.projectId = contextData.projectId;
             else if (contextData.pdfPath) trackerContext.detail = contextData.pdfPath; // Use pdfPath as detail if no projectId

            // Refine detail based on modal type AFTER basic context is set
             if (modalId === 'imageModal' && currentProjectData) {
                 trackerContext.detail = currentProjectData.prefix;
                 trackerContext.projectId = trackerContext.projectId || currentProjectData.prefix.replace(/[.\/]/g, ''); // Add projectId if missing
             } else if (modalId === 'pdfModal') {
                 trackerContext.detail = currentPdfOriginalPath || pdfViewer.src; // Prefer original path
                  // Try to infer projectId from path if missing
                  if (!trackerContext.projectId && currentPdfOriginalPath) {
                      trackerContext.projectId = currentPdfOriginalPath.split('/').pop().split('.')[0];
                  }
             } else if (modalId === 'descriptionModal') {
                  trackerContext.detail = modalDescTitle ? modalDescTitle.textContent : '';
                 // projectId should already be in trackerContext if passed via contextData
             } else if (modalId === 'publicationsModal'){
                 trackerContext.detail = 'Publication List';
             }

             window.portfolioTracker.trackModalOpen(modalId, trackerContext);
         }
         // --- End Tracking ---

         modalElement.classList.add('show');
         document.body.style.overflow = 'hidden';
         // Try focusing the close button first, then any other focusable element
         const focusable = modalElement.querySelector('.close-modal-btn') || modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
         if (focusable) setTimeout(() => { try { focusable.focus(); } catch(e){ console.warn("Focus failed:", e) } }, 50);
    }

    // --- Keep closeModal as is (no tracking needed on close typically) ---
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

    // --- Slideshow Functions ---
    // --- MODIFY showSlide to use new tracker ---
    function showSlide(slideNumber) {
         if (!currentProjectData || !slideImage || !slideCounter || !prevBtn || !nextBtn) return;
         // --- Calculate new slide number ---
         currentSlide = ((slideNumber - 1 + currentProjectData.totalSlides) % currentProjectData.totalSlides) + 1;
         const imageUrl = `${currentProjectData.prefix}${currentSlide}.${currentProjectData.extension}`;

         // --- Update image source and alt ---
         slideImage.src = imageUrl;
         slideImage.alt = `Project image ${currentSlide} of ${currentProjectData.totalSlides}`;

         // --- Update counter and button visibility ---
          if (currentProjectData.totalSlides === 1) {
              if(slideCounter) slideCounter.style.display = 'none';
              if(prevBtn) prevBtn.style.display = 'none';
              if(nextBtn) nextBtn.style.display = 'none';
          } else {
              if(slideCounter) slideCounter.textContent = `${currentSlide} / ${currentProjectData.totalSlides}`;
              if(slideCounter) slideCounter.style.display = 'block';
              if(prevBtn) prevBtn.style.display = 'block';
              if(nextBtn) nextBtn.style.display = 'block';
          }
          // --- Apply rotation ---
          const rotation = currentProjectData.rotations?.[currentSlide] ?? 0;
          slideImage.style.transform = `rotate(${rotation}deg)`;


         // --- Track Image View (using new tracker helper) ---
         // Check if the modal is *currently* shown before tracking
         if (imageModal && imageModal.classList.contains('show') && window.portfolioTracker) {
              let contextProjectId = currentProjectData.prefix?.replace(/[.\/]/g, ''); // Extract from prefix
              window.portfolioTracker.trackImageView(imageUrl, {
                  // Pass context clearly
                  projectId: contextProjectId,
                  slide: currentSlide,
                  totalSlides: currentProjectData.totalSlides
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
    // --- MODIFY to use new tracker ---
    document.querySelectorAll('.project-image[data-project-id]').forEach(element => {
         element.addEventListener('click', function(event) {
            const projectId = this.getAttribute('data-project-id');
            if (!projectId || !slideshowData[projectId]) return;

             // --- Track Project Click Intent (Image for Slideshow) ---
             if (window.portfolioTracker) {
                 window.portfolioTracker.trackEvent('project_click', { // Use a consistent 'project_click' type maybe?
                    element: 'image',
                    projectId: projectId,
                    action: 'open_slideshow'
                 });
             }
             // --- End Tracking ---

            // Open Slideshow Modal (calls openModal, which tracks modal open)
             if (imageModal) {
                 currentProjectData = slideshowData[projectId];
                 // showSlide(1) // Call showSlide *after* modal is confirmed open or track initial view in openModal
                 openModal(imageModal, { projectId: projectId }); // Tracks modal open
                 showSlide(1); // Show the first slide *after* initiating modal open
            } else { console.error("Image modal element not found!"); }
         });
    });
    // *** END Project Image Click Handler ***


    // *** Project Title Click Handler (for Description Modal / Specific PDFs) ***
    // --- MODIFY to use new tracker ---
    document.querySelectorAll('.project-info h3[data-project-id]').forEach(title => {
        const projectId = title.getAttribute('data-project-id');

        title.addEventListener('click', function(event) {
             // Prevent default link behavior early if it's needed for either modal type
             const descriptionDiv = this.closest('.project-card')?.querySelector('.description');
             const imageElement = this.closest('.project-card')?.querySelector('.project-image img');
             const hasDescriptionContent = descriptionDiv && imageElement && descriptionModal; // Check if elements for description modal exist

            // --- Track Project Click Intent (Title) ---
             if (window.portfolioTracker) {
                 window.portfolioTracker.trackEvent('project_click', { // Consistent event type
                     element: 'title',
                     projectId: projectId
                 });
             }
            // --- End Tracking ---

            let pdfPath = null;
            let pdfContext = { projectId: projectId };

            // --- Special Case PDFs (Uncomment and adjust if needed) ---
            // if (projectId === 'physiball') { pdfPath = './physiball/Physiballs handover.pdf'; pdfContext.pdfPath = pdfPath;}
            // else if (projectId === 'drake-music-project') { pdfPath = './drake-music/drake-music-handover.pdf'; pdfContext.pdfPath = pdfPath;}

            // --- Action: Open PDF Modal ---
            if (pdfPath) {
                event.preventDefault(); // Definitely prevent default for PDF
                if (!pdfModal || !pdfViewer) { console.error("PDF modal or viewer element not found!"); return; }
                currentPdfOriginalPath = pdfPath;

                pdfViewer.src = 'about:blank';
                if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);

                fetch(pdfPath)
                    .then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); })
                    .then(blob => {
                        currentPdfBlobUrl = URL.createObjectURL(blob);
                        pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0";
                        openModal(pdfModal, pdfContext); // Open modal with context
                    }).catch(err => {
                        console.error("PDF Blob Error:", err);
                        pdfViewer.src = pdfPath; // Fallback
                        openModal(pdfModal, pdfContext);
                    });
                return; // Stop further processing
            }

            // --- Default Case: Open Description Modal ---
            if (hasDescriptionContent && modalDescImage && modalDescTitle && modalDescText) { // Check all required elements again
                 event.preventDefault(); // Prevent default if opening description modal

                 modalDescTitle.textContent = this.textContent;
                 modalDescImage.src = imageElement.src;
                 modalDescImage.alt = imageElement.alt || this.textContent;
                 modalDescText.innerHTML = descriptionDiv.innerHTML;

                openModal(descriptionModal, { projectId: projectId }); // Pass context
            } else if (!pdfPath) { // Only log warning if not opening PDF and elements are missing
                 console.warn(`Clicked title for '${projectId}', but required elements for description modal are missing.`);
                 // Allow default browser behavior (e.g., if title is wrapped in <a href="#">)
            }
        });
    });
    // *** END Project Title Click Handler ***


    // Slideshow Navigation Buttons
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Keyboard Navigation (Escape for all modals, Arrows for slideshow)
    document.addEventListener('keydown', function(e) {
         if (e.key === "Escape") {
            [pdfModal, imageModal, publicationsModal, descriptionModal].forEach(modal => {
                if (modal && modal.classList.contains('show')) {
                    closeModal(modal);
                }
            });
         }
         if (imageModal?.classList.contains('show')) {
             if (e.key === "ArrowLeft") prevSlide();
             else if (e.key === "ArrowRight") nextSlide();
         }
    });

    // --- Hamburger Menu Logic ---
    // --- MODIFY to use new tracker ---
     if (hamburgerMenu && mobileNavPanel) {
         hamburgerMenu.addEventListener('click', () => {
             const isActive = hamburgerMenu.classList.toggle('active');
             mobileNavPanel.classList.toggle('active');
             document.body.style.overflow = isActive ? 'hidden' : '';
             // Track menu toggle
              if (window.portfolioTracker) {
                 window.portfolioTracker.trackEvent('mobile_menu_toggle', { state: isActive ? 'open' : 'close' });
              }
         });
     }
     // --- MODIFY Mobile Nav Link Click ---
     document.querySelectorAll('.mobile-nav-panel a.mobile-nav-link').forEach(link => {
         link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // --- Close menu logic ---
             if(hamburgerMenu && hamburgerMenu.classList.contains('active')) {
                 hamburgerMenu.classList.remove('active');
                 if(mobileNavPanel) mobileNavPanel.classList.remove('active');
                 document.body.style.overflow = '';
                  // Track menu close via link click
                 if (window.portfolioTracker) {
                      window.portfolioTracker.trackEvent('mobile_menu_toggle', { state: 'close', trigger: 'link_click', targetHref: href });
                 }
             }

             // Handle specific actions
             if (link.id === 'publications-link-mobile') {
                  e.preventDefault(); // Prevent default '#' link behavior
                  openPublicationsModal(); // This calls openModal, which handles tracking
             }
             // No 'else if' needed for #about, #projects etc. - the generic anchor click handles tracking
             // and default browser scroll behavior is desired.
             // External links will be caught by the generic link tracker.
         });
     });
    // --- END Hamburger Menu Logic ---


    // --- Publications Modal ---
    // --- MODIFY Publication Link Click ---
    function populatePublications() {
         if (!publicationsGrid) return;
         publicationsGrid.innerHTML = '';
         if (publicationsData.length === 0) { publicationsGrid.innerHTML = '<p>No publications available yet.</p>'; return; }
         publicationsData.forEach(pub => {
             const item = document.createElement('div'); item.classList.add('publication-item');
             const link = document.createElement('a'); link.href = pub.filePath; link.textContent = pub.title; link.rel = 'noopener noreferrer';

             link.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (!pdfModal || !pdfViewer) { console.error("PDF modal or viewer element not found!"); return; }
                 const pdfPath = link.getAttribute('href');
                 currentPdfOriginalPath = pdfPath;

                 // Track click intent for this specific publication link
                 if (window.portfolioTracker) {
                     window.portfolioTracker.trackEvent('publication_click', { title: pub.title, path: pdfPath });
                 }

                 pdfViewer.src = 'about:blank';
                 if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl);

                 fetch(pdfPath)
                     .then(response => { if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`); return response.blob(); })
                     .then(blob => {
                         currentPdfBlobUrl = URL.createObjectURL(blob);
                         pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0";
                         closeModal(publicationsModal); // Close pub list first
                         setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath, projectId: pub.title.replace(/ /g,'_') }), 50); // Pass path and title as context
                     }).catch(err => {
                        console.error("PDF Blob Error:", err);
                        pdfViewer.src = pdfPath; // Fallback
                        closeModal(publicationsModal);
                        setTimeout(() => openModal(pdfModal, { pdfPath: pdfPath, projectId: pub.title.replace(/ /g,'_') }), 50); // Pass context on fallback too
                     });
             });
             item.appendChild(link);
             publicationsGrid.appendChild(item);
         });
    }
    // openPublicationsModal calls openModal, which tracks the modal open
    function openPublicationsModal() {
        if(publicationsModal) {
            populatePublications(); // Ensure content is fresh
            openModal(publicationsModal, { projectId: 'publications_list' }); // Add specific context
        } else {
            console.error("Publications modal element not found!");
        }
    }
    // Desktop Publications Link Listener (keep existing, calls openPublicationsModal)
    if (publicationsLink) {
         publicationsLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default '#' link behavior
            openPublicationsModal();
        });
     }
    // --- END Publications Modal ---


    // --- Scroll to Top Button ---
    // --- MODIFY click listener to use new tracker ---
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
             if (scrollToTopBtn) { scrollToTopBtn.classList.toggle('show', window.pageYOffset > 400); }
        }, { passive: true });
        scrollToTopBtn.addEventListener('click', () => {
             if (window.portfolioTracker) {
                 window.portfolioTracker.trackEvent('scroll_to_top');
             }
             window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    // --- END Scroll to Top Button ---

    // --- Form Submission Tracking ---
    function handleFormSubmit(event) {
        // Find the form element
        const form = event.target;
        let formType = 'unknown_form';
        if (form.closest('.contact-form')) formType = 'contact_form';
        if (form.closest('.feedback-form')) formType = 'feedback_form';

        if (window.portfolioTracker) {
            // Gather basic form data (optional, be mindful of privacy)
            let details = { formType: formType };
            // Example: get subject if available
            // const subjectInput = form.querySelector('input[name="subject"]');
            // if (subjectInput) details.subject = subjectInput.value.substring(0, 50);

             window.portfolioTracker.trackEvent('form_submit', details);
        }
        // Allow the form submission to proceed naturally to FormSubmit.co
    }

    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    if (feedbackForm) {
         feedbackForm.addEventListener('submit', handleFormSubmit);
    }
    // --- End Form Submission Tracking ---


    // --- Footer Year ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear(); // Update year dynamically

    // --- Image Protection (Basic) ---
    document.addEventListener('contextmenu', e => {
        if (e.target.tagName === 'IMG' && (e.target.closest('.image-modal') || e.target.closest('.description-modal'))) {
             e.preventDefault();
        }
    });
    document.addEventListener('dragstart', e => {
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
            if (feedbackItems.length < 2) return;
            feedbackItems[currentFeedbackIndex].classList.remove('active');
            currentFeedbackIndex = (currentFeedbackIndex + 1) % feedbackItems.length;
            feedbackItems[currentFeedbackIndex].classList.add('active');
        }

        function startFeedbackSlider() {
            clearInterval(feedbackInterval);
            if (feedbackItems.length > 1) {
                feedbackInterval = setInterval(showNextFeedback, intervalTime);
            }
        }

        function stopFeedbackSlider() {
            clearInterval(feedbackInterval);
        }

        if (feedbackItems.length > 0) {
            feedbackItems.forEach(item => item.classList.remove('active'));
            feedbackItems[0].classList.add('active');
            startFeedbackSlider();
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

// --- END OF FILE script.js (Integrated Tracker - FOR PORTFOLIO) ---
