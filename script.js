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
    const downloadPdfFallback = document.getElementById("downloadPdfFallback");
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

    // --- Typewriter Effect for Hero ---
    const heroPhrase = document.querySelector('.hero p.reveal');
    if (heroPhrase) {
        const textToType = heroPhrase.textContent;
        heroPhrase.textContent = '';
        heroPhrase.style.opacity = '1'; // Ensure it's visible before animation finishes
        heroPhrase.style.visibility = 'visible';
        heroPhrase.style.transform = 'translateY(0)'; // overrides .reveal so we can type
        heroPhrase.style.display = 'inline'; // Changed from 'inline-block' so it wraps naturally
        heroPhrase.style.whiteSpace = 'normal'; // Allow standard text wrapping on smaller screens!
        heroPhrase.style.borderRight = '0.15em solid var(--accent-secondary)'; // The cursor
        heroPhrase.style.letterSpacing = '.15em'; // Spacing
        
        let i = 0;
        function typeWriter() {
            if (i < textToType.length) {
                heroPhrase.innerHTML += textToType.charAt(i);
                i++;
                setTimeout(typeWriter, 50); // Speed of typing
            } else {
                heroPhrase.style.borderRight = 'none'; // remove cursor at end
            }
        }
        setTimeout(typeWriter, 500); // Wait 0.5s before starting
    }

    // --- Project Filtering ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filterValue = btn.getAttribute('data-filter');
                
                projectCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category').includes(filterValue)) {
                        card.style.display = 'flex';
                        setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => card.style.display = 'none', 300);
                    }
                });
            });
        });
    }

    // --- 3D Tilt Effect on Project Cards ---
    projectCards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5; // Max rotation 5deg
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s ease-out'; // Smooth return
        });
        
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none'; // Snappy follow
        });
    });

    // --- Slideshow Data ---
    const slideshowData = {
        // *** NEW PROJECT ADDED HERE ***
        // IMPORTANT: Assumes you have renamed your image files in this folder to be 1.jpg, 2.jpg, ..., 7.jpg
        'water-filtration':    { totalSlides: 8,  prefix: './WJ_FiltrationSystem/', extension: 'jpg' },
        
        'drake-music-project': { totalSlides: 15, prefix: './drake-music/',       extension: 'png' },
        'clock':               { totalSlides: 1,  prefix: './mdf-clock/',         extension: 'png' },
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
                if (downloadPdfFallback) { downloadPdfFallback.style.display = 'none'; downloadPdfFallback.href = '#'; }
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
                if (downloadPdfFallback) {
                    downloadPdfFallback.href = pdfPath;
                    downloadPdfFallback.style.display = 'inline-block';
                }

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
                 if (downloadPdfFallback) {
                     downloadPdfFallback.href = pdfPath;
                     downloadPdfFallback.style.display = 'inline-block';
                 }

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


    // --- Form AJAX Submission Hijack ---
    const contactFormEl = document.getElementById('mainContactForm');
    const contactMessageEl = document.getElementById('contact-form-message');
    const contactSubmitBtn = document.getElementById('contactSubmitBtn');

    if (contactFormEl) {
        contactFormEl.addEventListener('submit', function(e) {
            e.preventDefault(); // Stop standard form submission
            
            // Basic validation
            if (!contactFormEl.checkValidity()) {
                contactFormEl.reportValidity();
                return;
            }

            // Visual feedback
            contactSubmitBtn.textContent = 'Sending...';
            contactSubmitBtn.disabled = true;

            const formData = new FormData(contactFormEl);
            const plainFormData = Object.fromEntries(formData.entries());

            fetch(contactFormEl.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(plainFormData),
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.success === "false" || data.success === false) {
                    throw new Error(data.message || 'Form submission failed on server.');
                }
                contactFormEl.style.display = 'none'; // Hide form
                contactMessageEl.style.display = 'block'; // Show success message
                
                if (window.portfolioTracker) {
                    window.portfolioTracker.trackEvent('contact_form_success');
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                alert("There was an error sending your message: " + (error.message || "Please try again later or email directly."));
                contactSubmitBtn.textContent = 'Send Message';
                contactSubmitBtn.disabled = false;
            });
        });
    }

    const feedbackFormEl = document.getElementById('mainFeedbackForm');
    const feedbackMessageEl = document.getElementById('feedback-form-message');
    const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');

    if (feedbackFormEl) {
        feedbackFormEl.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!feedbackFormEl.checkValidity()) {
                feedbackFormEl.reportValidity();
                return;
            }

            feedbackSubmitBtn.textContent = 'Sending...';
            feedbackSubmitBtn.disabled = true;

            const formData = new FormData(feedbackFormEl);
            const plainFormData = Object.fromEntries(formData.entries());

            fetch(feedbackFormEl.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(plainFormData),
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.success === "false" || data.success === false) {
                    throw new Error(data.message || 'Form submission failed on server.');
                }
                feedbackFormEl.style.display = 'none';
                feedbackMessageEl.style.display = 'block';
                
                if (window.portfolioTracker) {
                    window.portfolioTracker.trackEvent('feedback_form_success');
                }
            })
            .catch(error => {
                console.error('Error submitting feedback:', error);
                alert("There was an error sending your feedback: " + (error.message || "Please try again later."));
                feedbackSubmitBtn.textContent = 'Submit Feedback'; // Changed to match HTML
                feedbackSubmitBtn.disabled = false;
            });
        });
    }
    // --- End Form AJAX Submission Hijack ---

    console.log('Portfolio script fully initialized.');

}); // End DOMContentLoaded

// --- ANIMATED PARTICLES BACKGROUND (Outside DOMContentLoaded so it can init fast) ---
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    const numParticles = window.innerWidth < 768 ? 40 : 80; // Fewer on mobile
    
    // Config
    const maxDistance = 150;
    let mouse = { x: null, y: null, radius: 150 };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = document.getElementById('hero-section').offsetHeight || window.innerHeight; // Fill hero
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.size = Math.random() * 2 + 1;
            this.color = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#00ff64';
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            // Mouse interaction
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    this.vx += forceDirectionX * force * 0.1;
                    this.vy += forceDirectionY * force * 0.1;
                }
            }

            // Normal movement
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls gently
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;
            
            // Friction
            this.vx *= 0.99;
            this.vy *= 0.99;
            
            // Return to wander
            this.vx += (Math.random() - 0.5) * 0.05;
            this.vy += (Math.random() - 0.5) * 0.05;

            // Limit speed
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if(speed > 2) {
                this.vx = (this.vx / speed) * 2;
                this.vy = (this.vy / speed) * 2;
            }
        }
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < maxDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 255, 100, ${1 - dist/maxDistance})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    }

    // Event listeners for interactivity
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        heroSection.addEventListener('mouseleave', () => {
             mouse.x = null;
             mouse.y = null;
        });
    }

    window.addEventListener('resize', () => {
        resize();
        init(); // Reinitialize to redistribute
    });

    init();
    animate();
})();
// --- END PARTICLES ---

// --- END OF FILE script.js (Integrated Tracker - FOR PORTFOLIO) ---
