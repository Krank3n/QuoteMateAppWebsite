/* ============================================
   QuoteMate — Main JavaScript
   Vanilla JS, no dependencies
   ============================================ */

(function () {
    'use strict';

    // --- Analytics Helper ---
    function track(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params || {});
        }
    }

    // --- Mobile Navigation ---
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function () {
            const isOpen = navLinks.classList.toggle('mobile-open');
            mobileToggle.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('mobile-open');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Sticky Header Background on Scroll ---
    const header = document.getElementById('site-header');

    if (header) {
        function updateHeader() {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        window.addEventListener('scroll', updateHeader, { passive: true });
        updateHeader();
    }

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;

            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                track('nav_click', { link_target: targetId });
            }
        });
    });

    // --- CTA Button Tracking ---
    // Track all store buttons (App Store, Google Play, Web App)
    document.querySelectorAll('.btn-store, .pricing-btn, .nav-cta').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var label = this.getAttribute('aria-label') || this.textContent.trim();
            var section = getClosestSection(this);

            // Determine CTA type
            var ctaType = 'cta_click';
            if (label.toLowerCase().includes('app store')) ctaType = 'app_store_click';
            else if (label.toLowerCase().includes('google play')) ctaType = 'google_play_click';
            else if (label.toLowerCase().includes('web app') || label.toLowerCase().includes('web')) ctaType = 'web_app_click';
            else if (this.classList.contains('pricing-btn')) ctaType = 'pricing_cta_click';

            track(ctaType, {
                button_text: label.substring(0, 100),
                section: section
            });
        });
    });

    // Track "Try on Web" links
    document.querySelectorAll('.hero-web-link').forEach(function (link) {
        link.addEventListener('click', function () {
            track('web_app_click', {
                button_text: 'Try on Web',
                section: getClosestSection(this)
            });
        });
    });

    // --- FAQ Accordion ---
    var faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
        var button = item.querySelector('.faq-question');
        if (!button) return;

        button.addEventListener('click', function () {
            var isActive = item.classList.contains('active');
            var questionText = button.querySelector('span');
            questionText = questionText ? questionText.textContent.trim() : '';

            // Close all other items
            faqItems.forEach(function (other) {
                if (other !== item) {
                    other.classList.remove('active');
                    var otherBtn = other.querySelector('.faq-question');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            item.classList.toggle('active', !isActive);
            button.setAttribute('aria-expanded', !isActive);

            // Track FAQ open
            if (!isActive) {
                track('faq_open', { question: questionText.substring(0, 100) });
            }
        });
    });

    // --- Section View Tracking (IntersectionObserver) ---
    var trackedSections = {};
    var sections = document.querySelectorAll('section[id]');

    if ('IntersectionObserver' in window && sections.length > 0) {
        var sectionObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting && !trackedSections[entry.target.id]) {
                        trackedSections[entry.target.id] = true;
                        track('section_view', { section: entry.target.id });
                    }
                });
            },
            { threshold: 0.3 }
        );

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });
    }

    // --- Scroll Reveal (IntersectionObserver) ---
    var revealElements = document.querySelectorAll('[data-reveal]');

    if ('IntersectionObserver' in window && revealElements.length > 0) {
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px',
            }
        );

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        // Fallback: show everything immediately
        revealElements.forEach(function (el) {
            el.classList.add('revealed');
        });
    }

    // --- Scroll Depth Tracking ---
    var scrollMilestones = { 25: false, 50: false, 75: false, 100: false };

    function checkScrollDepth() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;
        var percent = Math.round((scrollTop / docHeight) * 100);

        [25, 50, 75, 100].forEach(function (milestone) {
            if (percent >= milestone && !scrollMilestones[milestone]) {
                scrollMilestones[milestone] = true;
                track('scroll_depth', { percent: milestone });
            }
        });
    }

    window.addEventListener('scroll', checkScrollDepth, { passive: true });

    // --- Time on Page Tracking ---
    var timeIntervals = [30, 60, 120, 300]; // seconds
    timeIntervals.forEach(function (seconds) {
        setTimeout(function () {
            track('time_on_page', { seconds: seconds });
        }, seconds * 1000);
    });

    // --- Outbound Link Tracking ---
    document.querySelectorAll('a[href^="http"], a[href^="mailto:"]').forEach(function (link) {
        link.addEventListener('click', function () {
            var href = this.getAttribute('href');
            if (href.startsWith('mailto:')) {
                track('contact_email_click', { email: href.replace('mailto:', '') });
            } else if (!href.includes(window.location.hostname)) {
                track('outbound_link_click', { url: href });
            }
        });
    });

    // --- Cookie Consent Banner ---
    var cookieBanner = document.getElementById('cookie-banner');
    var cookieAccept = document.getElementById('cookie-accept');
    var cookieDecline = document.getElementById('cookie-decline');

    if (cookieBanner) {
        var cookieConsent = localStorage.getItem('qm_cookie_consent');

        if (!cookieConsent) {
            // Show banner after a short delay
            setTimeout(function () {
                cookieBanner.classList.add('visible');
            }, 1500);
        }

        function hideBanner(value) {
            localStorage.setItem('qm_cookie_consent', value);
            cookieBanner.classList.remove('visible');
            track('cookie_consent', { action: value });
        }

        if (cookieAccept) {
            cookieAccept.addEventListener('click', function () {
                hideBanner('accepted');
            });
        }

        if (cookieDecline) {
            cookieDecline.addEventListener('click', function () {
                hideBanner('declined');
            });
        }
    }

    // --- Android Install Bottom Sheet ---
    var installSheet = document.getElementById('android-install-sheet');
    var installSheetClose = document.getElementById('install-sheet-close');

    if (installSheet) {
        var isAndroid = /Android/i.test(navigator.userAgent);
        var installDismissed = localStorage.getItem('qm_install_dismissed');

        if (isAndroid && !installDismissed) {
            // Show after a delay, and after cookie banner if needed
            var delay = cookieBanner && !localStorage.getItem('qm_cookie_consent') ? 4000 : 2000;
            setTimeout(function () {
                installSheet.classList.add('visible');
                track('install_sheet_shown', { platform: 'android' });
            }, delay);
        }

        if (installSheetClose) {
            installSheetClose.addEventListener('click', function () {
                installSheet.classList.remove('visible');
                localStorage.setItem('qm_install_dismissed', Date.now());
                track('install_sheet_dismissed', { platform: 'android' });
            });
        }

        // Track click on the install button
        var installBtn = installSheet.querySelector('.install-sheet-btn');
        if (installBtn) {
            installBtn.addEventListener('click', function () {
                track('install_sheet_clicked', { platform: 'android' });
            });
        }
    }

    // --- Helper: Get closest section ID ---
    function getClosestSection(el) {
        var section = el.closest('section[id]');
        if (section) return section.id;
        // Check common wrappers
        var parent = el.closest('.hero, .final-cta, .site-footer, .platforms');
        if (parent) {
            if (parent.classList.contains('hero')) return 'hero';
            if (parent.classList.contains('final-cta')) return 'download';
            if (parent.classList.contains('site-footer')) return 'footer';
            if (parent.classList.contains('platforms')) return 'platforms';
        }
        return 'unknown';
    }

})();
