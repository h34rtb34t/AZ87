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

    // --- Slideshow Data (Using ORIGINAL Relative Paths) --- CORRECTED
    const slideshowData = {
        // ADDED Drake Music Project
        'drake-music-project': { totalSlides: 15, prefix: './drake-music/', extension: 'png' },
        // Added Clock Project
        'clock':               { totalSlides: 1,  prefix: './mdf-clock/',        extension: 'png' },
        // Existing Projects
        rubiks:     { totalSlides: 16, prefix: './Rubiks_cube/',         extension: 'webp', rotations: { 1: -90, 3: -90, 5: -90 } },
        turtle:     { totalSlides: 27, prefix: './turtle-cloud/',        extension: 'webp' },
        helicopter: { totalSlides: 32, prefix: './1dof helicopter/',     extension: 'webp', rotations: { 29: -90 } },
        violin:     { totalSlides: 10, prefix: './violin-bot-player/',   extension: 'jpg' },
        crs:        { totalSlides: 1,  prefix: './csr robot/',           extension: 'png' }, // Make sure totalSlides is correct
        wjet:       { totalSlides: 37, prefix: './wjet/',                extension: 'png' }
    };
    let currentSlide = 1;
    let currentProjectData = null;
    let currentPdfBlobUrl = null;

     // --- Publications Data (Using ORIGINAL Relative Paths) ---
     const publicationsData = [
        { title: "1DoF PID Control Helicopter", filePath: "./PID.pdf" },
        { title: "MDXaz87Thesis",             filePath: "./MDXaz87Thesis.pdf" },
        { title: "PhysiBall",             filePath: "./physiball/Physiballs handover.pdf" },
        { title: "MDF-Mechanical-clock-Development",             filePath: "./mdf-clock/Wooden-Clock-Design&Study.pdf" },
        { title: "Pneumatics-System-Concepts",             filePath: "./pde-industrial-automation/Basic-Concepts-and-Implementation-in-Pneumatic-Automation.pdf" },
        { title: "Pneumatics-System-Concepts",             filePath: "./FunBox/FunBox-paper.pdf" },
        // Physiball & Drake PDFs handled by project title click
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

    // --- Modal Functions ---
    function openModal(modalElement) {
         if (!modalElement) return;
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
            }
            if (modalElement === imageModal) {
                currentProjectData = null;
                slideImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                // Ensure slide counter and buttons are reset/hidden for single image modals if needed
                if (slideCounter) slideCounter.style.display = 'block'; // Default show
                if (prevBtn) prevBtn.style.display = 'block';
                if (nextBtn) nextBtn.style.display = 'block';
            }
         }, 300);
    }

    // --- Slideshow Functions ---
    function showSlide(slideNumber) {
         if (!currentProjectData || !slideImage || !slideCounter || !prevBtn || !nextBtn) return; // Added checks for buttons
         currentSlide = ((slideNumber - 1 + currentProjectData.totalSlides) % currentProjectData.totalSlides) + 1;
         const imageUrl = `${currentProjectData.prefix}${currentSlide}.${currentProjectData.extension}`;
         slideImage.src = imageUrl;
         slideImage.alt = `Project image ${currentSlide} of ${currentProjectData.totalSlides}`;

         // Handle single-image display (like the clock)
         if (currentProjectData.totalSlides === 1) {
             slideCounter.style.display = 'none'; // Hide counter
             prevBtn.style.display = 'none';      // Hide prev button
             nextBtn.style.display = 'none';      // Hide next button
         } else {
             slideCounter.textContent = `${currentSlide} / ${currentProjectData.totalSlides}`;
             slideCounter.style.display = 'block'; // Show counter
             prevBtn.style.display = 'block';     // Show prev button
             nextBtn.style.display = 'block';     // Show next button
         }

         const rotation = currentProjectData.rotations?.[currentSlide] ?? 0;
         slideImage.style.transform = `rotate(${rotation}deg)`;
    }
    function nextSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide + 1); }
    function prevSlide() { if (currentProjectData && currentProjectData.totalSlides > 1) showSlide(currentSlide - 1); }

    // --- Event Listeners ---
    closeModalBtns.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal'))));
    [pdfModal, imageModal, publicationsModal].forEach(modal => {
        if(modal) modal.addEventListener('click', e => (e.target === modal) && closeModal(modal));
    });

    // *** Project Click Handler (Handles PDF vs Slideshow vs Single Image) *** CORRECTED
    document.querySelectorAll('[data-project-id]').forEach(element => {
        element.addEventListener('click', function(event) {
            const projectId = this.getAttribute('data-project-id');
            const isTitleClick = this.tagName === 'H3';
            const isImageClick = this.classList.contains('project-image');

            // 1. Handle Clock Project Click (Image or Title) - Open Single Image Modal
            if (projectId === 'clock' && (isTitleClick || isImageClick)) {
                 event.preventDefault(); // Prevent default link behavior if any
                 if (slideshowData[projectId] && imageModal) { // Check if data and modal exist
                     currentProjectData = slideshowData[projectId];
                     showSlide(1); // Show the first (and only) slide
                     openModal(imageModal);
                 }
                 return; // Stop further processing for the clock project
            }

            // 2. Handle Specific PDF Triggers (Only on Title Click for other projects)
            let pdfPath = null;
            if (isTitleClick) {
                if (projectId === 'physiball') {
                    pdfPath = './physiball/' + encodeURIComponent('Physiballs handover.pdf');
                } else if (projectId === 'drake-music-project') {
                    pdfPath = './drake-music/drake-music-handover.pdf';
                }
            }

            // 3. Open PDF Modal if pdfPath is set
            if (pdfPath) {
                event.preventDefault();
                if (!pdfModal || !pdfViewer) return;

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
                        openModal(pdfModal);
                    }).catch(err => {
                        console.error("PDF Blob Error:", err);
                        pdfViewer.src = pdfPath; // Fallback to direct path
                        openModal(pdfModal);
                    });
                return; // Stop further processing after handling PDF
            }

            // 4. Handle Slideshow for other projects (Only on Image Click)
            //    (This block is reached only if it's not the clock project and not a PDF trigger)
            if (slideshowData[projectId] && isImageClick) {
                event.preventDefault();
                 if (!imageModal) return;
                 currentProjectData = slideshowData[projectId];
                 showSlide(1); // Reset to first slide for slideshows
                 openModal(imageModal);
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
             // Close menu if open
             if(hamburgerMenu && hamburgerMenu.classList.contains('active')) {
                 hamburgerMenu.classList.remove('active');
                 if(mobileNavPanel) mobileNavPanel.classList.remove('active');
                 document.body.style.overflow = '';
             }
             // Special handling for publications link in mobile menu
             if (link.id === 'publications-link-mobile') {
                  e.preventDefault();
                  openPublicationsModal();
             } else {
                 // Allow normal navigation for other links
                 // Smooth scrolling is handled by CSS 'scroll-behavior: smooth;'
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
             const link = document.createElement('a'); link.href = pub.filePath; link.textContent = pub.title; link.target = '_blank'; link.rel = 'noopener noreferrer';
             // Make publication links open PDF modal instead of new tab
             link.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (!pdfModal || !pdfViewer) return;

                 const pdfPath = link.getAttribute('href');
                 pdfViewer.src = 'about:blank'; // Clear previous PDF
                 if (currentPdfBlobUrl) URL.revokeObjectURL(currentPdfBlobUrl); // Revoke old blob URL

                 fetch(pdfPath)
                     .then(response => {
                         if (!response.ok) throw new Error(`Fetch Error: ${response.status} for ${pdfPath}`);
                         return response.blob();
                     })
                     .then(blob => {
                         currentPdfBlobUrl = URL.createObjectURL(blob);
                         pdfViewer.src = currentPdfBlobUrl + "#toolbar=0&navpanes=0"; // Use blob URL
                         // Close publications modal BEFORE opening PDF modal
                         closeModal(publicationsModal);
                         setTimeout(() => openModal(pdfModal), 50); // Slight delay may help rendering
                     }).catch(err => {
                         console.error("PDF Blob Error:", err);
                         pdfViewer.src = pdfPath; // Fallback to direct path
                         closeModal(publicationsModal);
                         setTimeout(() => openModal(pdfModal), 50);
                     });
             });
             item.appendChild(link);
             publicationsGrid.appendChild(item);
         });
    }
    function openPublicationsModal() { if(publicationsModal) { populatePublications(); openModal(publicationsModal); } }
    if (publicationsLink) publicationsLink.addEventListener('click', (e) => { e.preventDefault(); openPublicationsModal(); });

    // Scroll to Top Button
    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (scrollToTopBtn) { scrollToTopBtn.classList.toggle('show', window.pageYOffset > 400); }
        }, { passive: true });
        scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Footer Year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Image Protection
    document.addEventListener('contextmenu', e => (e.target.tagName === 'IMG') && e.preventDefault());
    document.addEventListener('dragstart', e => (e.target.tagName === 'IMG') && e.preventDefault());

}); // End DOMContentLoaded
