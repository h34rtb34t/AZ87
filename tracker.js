// --- PORTFOLIO ANALYTICS TRACKER ---
(function() {
    const LOGGING_WORKER_URL = 'https://stats-ingress-worker.azelbane87.workers.dev/';

    function sendEvent(eventType, eventDetails = {}) {
        if (!LOGGING_WORKER_URL || LOGGING_WORKER_URL.includes('YOUR_LOGGING_WORKER_SUBDOMAIN')) {
            console.warn("Logging worker URL not configured correctly. Tracking disabled.");
            return;
        }

        const detailsProjectId = eventDetails.projectId || eventDetails.context || eventDetails.trackId || null;

        const payload = {
            type: eventType,
            timestamp: new Date().toISOString(),
            page: window.location.href,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            referrer: document.referrer,
            projectId: detailsProjectId,
            details: eventDetails
        };

        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

        try {
            navigator.sendBeacon(LOGGING_WORKER_URL, blob);
        } catch (error) {
            console.error('Error sending tracking beacon:', error);
            fetch(LOGGING_WORKER_URL, { method: 'POST', body: JSON.stringify(payload), headers: {'Content-Type': 'application/json'}, keepalive: true })
             .catch(fetchErr => console.error('Tracking fetch fallback error:', fetchErr));
        }
    }

    sendEvent('pageview');

    document.body.addEventListener('click', function(event) {
        const element = event.target;
        const link = element.closest('a');
        const button = element.closest('button');
        const projectCard = element.closest('.project-card');
        const trackedElement = element.closest('[data-track-id]');
        const publicationItemLink = element.closest('.publication-item a');
        const projectImage = element.closest('.project-image[data-project-id]');
        const projectTitle = element.closest('.project-info h3[data-project-id]');
        const themeToggle = element.closest('#theme-toggle-btn, #theme-toggle-btn-mobile');
        const scrollToTop = element.closest('#scrollToTopBtn');
        const hamburger = element.closest('#hamburger-menu');
        const mobileNavLink = element.closest('.mobile-nav-panel a.mobile-nav-link');
        const modalCloseBtn = element.closest('[data-close-modal]');

        let contextProjectId = null;
        if (projectCard) {
            contextProjectId = projectCard.getAttribute('data-project-id');
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

        let eventType = 'generic_click';
        let details = {
            targetElement: element.tagName,
            targetId: element.id || null,
            targetClasses: element.className || null,
            ...(contextProjectId && { projectId: contextProjectId })
        };
        let shouldTrack = true;

        if (projectImage || projectTitle || publicationItemLink || themeToggle || scrollToTop || hamburger || mobileNavLink || modalCloseBtn) {
            shouldTrack = false;
        } else if (link) {
            details.href = link.getAttribute('href');
            details.linkText = link.textContent?.trim().substring(0, 100);

            if (details.href) {
                if (details.href.startsWith('#')) {
                    eventType = 'anchor_click';
                    details.linkType = 'anchor';
                    if (link.id === 'publications-link' || link.id === 'publications-link-mobile') shouldTrack = false;
                } else {
                    eventType = 'link_click';
                    if (link.hostname === window.location.hostname || details.href.startsWith('/') || details.href.startsWith('.')) {
                         details.linkType = 'internal';
                    } else {
                         details.linkType = 'external';
                    }
                    if (link.closest('.project-links')) details.linkTypeDetail = 'project_link';
                    if (link.closest('.social-links') || link.closest('.contact-links a[href*="linkedin"]') || link.closest('.contact-links a[href*="github"]')) details.linkTypeDetail = 'social_contact_link';
                    if (details.href.includes('vimeo.com')) details.linkTypeDetail = 'video_platform_link';
                    if (details.href.includes('buymeacoffee.com')) details.linkTypeDetail = 'donation_link';
                    if (details.href.endsWith('.mp4')) details.linkTypeDetail = 'direct_video_link';
                    if (details.href.endsWith('.pdf')) details.linkTypeDetail = 'direct_pdf_link';
                    if (link.getAttribute('target') === '_blank') details.targetBlank = true;
                }
            } else {
                 eventType = 'link_click';
                 details.linkType = 'nohref';
            }
            if (!details.projectId && trackedElement) details.trackId = trackedElement.getAttribute('data-track-id');
        } else if (button) {
            eventType = 'button_click';
            details.buttonText = button.textContent?.trim().substring(0, 100);
            details.buttonId = button.id || null;
            details.buttonClasses = button.className || null;
            if (!details.projectId && trackedElement) details.trackId = trackedElement.getAttribute('data-track-id');
        } else if (trackedElement) {
            eventType = trackedElement.getAttribute('data-track-event-type') || 'tracked_element_click';
            details.trackId = trackedElement.getAttribute('data-track-id');
        } else if (projectCard) {
             eventType = 'project_card_area_click';
        }

        if (shouldTrack) sendEvent(eventType, details);
    }, true);

    window.portfolioTracker = {
        trackEvent: sendEvent,
        trackModalOpen: (modalId, context = {}) => {
            let detail = context.detail || context.pdfPath || (context.projectId ? `Project: ${context.projectId}` : '');
            let projectId = context.projectId || null;
             if (!projectId && typeof context.detail === 'string' && context.detail.includes('/')) {
                 projectId = context.detail.split('/').pop().split('.')[0];
             }
            if (!projectId && typeof context.context === 'string' && context.context.length > 0) projectId = context.context;

            sendEvent('modal_open', { modalId: modalId, detail: String(detail).substring(0,150), projectId: projectId });
        },
        trackImageView: (imageSrc, context = {}) => {
             let projectId = context.projectId || null;
              if (!projectId && typeof context.context === 'string' && context.context.length > 0) projectId = context.context;
               if (!projectId && typeof imageSrc === 'string' && imageSrc.includes('/')) {
                   const pathParts = imageSrc.split('/');
                   if (pathParts.length > 2) projectId = pathParts[pathParts.length - 2];
               }
             sendEvent('image_view', {
                 imageSrc: String(imageSrc).substring(0, 200),
                 slide: context.slide || null,
                 totalSlides: context.totalSlides || null,
                 projectId: projectId
             });
        }
    };
    console.log("Portfolio tracker initialized.");
})();
