#!/usr/bin/env node
/**
 * QuoteMate Programmatic SEO Page Generator
 * Generates trade, trade+city, and template pages from data.json
 * Run: node seo/build.js
 */

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const { site, trades, cities, quoteTemplates, guides } = data;

const OUTPUT_DIR = path.join(__dirname, '..', 'pages');

// Ensure output dirs exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// ─── Shared HTML components ────────────────────────────────────────────────

function htmlHead({ title, description, canonical, ogTitle }) {
    return `<!DOCTYPE html>
<html lang="en-AU">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Google Analytics (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-E3JERN2D5V"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-E3JERN2D5V');
    </script>

    <title>${escHtml(title)}</title>
    <meta name="description" content="${escHtml(description)}">
    <link rel="canonical" href="${canonical}">
    <link rel="sitemap" type="application/xml" href="/sitemap.xml">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${escHtml(ogTitle || title)}">
    <meta property="og:description" content="${escHtml(description)}">
    <meta property="og:image" content="https://hansendev.com.au/assets/projects/quotemate-app.png">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escHtml(ogTitle || title)}">
    <meta name="twitter:description" content="${escHtml(description)}">
    <meta name="twitter:image" content="https://hansendev.com.au/assets/projects/quotemate-app.png">

    <!-- Apple Smart App Banner -->
    <meta name="apple-itunes-app" content="app-id=PLACEHOLDER">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/assets/favicon.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="/css/styles.css">
    <link rel="stylesheet" href="/css/seo-pages.css">
</head>`;
}

function header() {
    return `
<body>
    <header class="site-header" id="site-header">
        <nav class="nav-container" aria-label="Main navigation">
            <a href="/" class="logo" aria-label="QuoteMate home">
                <img class="logo-icon" src="/assets/logo.png" alt="QuoteMate logo" width="36" height="36">
                <span class="logo-text">Quote<span class="logo-accent">Mate</span></span>
            </a>
            <ul class="nav-links" id="nav-links" role="menubar">
                <li role="none"><a href="/#features" role="menuitem">Features</a></li>
                <li role="none"><a href="/#how-it-works" role="menuitem">How It Works</a></li>
                <li role="none"><a href="/#pricing" role="menuitem">Pricing</a></li>
                <li role="none"><a href="/#faq" role="menuitem">FAQ</a></li>
            </ul>
            <a href="#download" class="btn btn-primary nav-cta">Download App</a>
            <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
        </nav>
    </header>`;
}

function ctaSection() {
    return `
        <section class="final-cta" id="download">
            <div class="container">
                <div class="final-cta-content">
                    <h2 class="section-title">Ready to Quote <span class="text-gradient">Smarter?</span></h2>
                    <p class="section-subtitle">Join thousands of Australian tradies who've ditched spreadsheets and handwritten quotes.</p>
                    <div class="hero-ctas">
                        <a href="${site.appStoreUrl}" class="btn btn-store" aria-label="Download on the App Store">
                            <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
                            <span><small>Download on the</small>App Store</span>
                        </a>
                        <a href="${site.playStoreUrl}" class="btn btn-store" aria-label="Get it on Google Play">
                            <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
                            <span><small>Get it on</small>Google Play</span>
                        </a>
                    </div>
                    <a href="${site.webAppUrl}" class="hero-web-link">Or try it on the web &rarr;</a>
                </div>
            </div>
        </section>`;
}

function footer() {
    return `
    <footer class="site-footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a href="/" class="logo" aria-label="QuoteMate home">
                        <img class="logo-icon" src="/assets/logo.png" alt="QuoteMate logo" width="32" height="32">
                        <span class="logo-text">Quote<span class="logo-accent">Mate</span></span>
                    </a>
                    <p class="footer-tagline">Professional quotes &amp; invoices for Australian tradies.</p>
                </div>
                <div class="footer-links">
                    <h4>Product</h4>
                    <ul>
                        <li><a href="/#features">Features</a></li>
                        <li><a href="/#pricing">Pricing</a></li>
                        <li><a href="/#faq">FAQ</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Legal</h4>
                    <ul>
                        <li><a href="/privacy.html">Privacy Policy</a></li>
                        <li><a href="/terms.html">Terms of Service</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Connect</h4>
                    <ul>
                        <li><a href="mailto:hello@quotemateapp.au">hello@quotemateapp.au</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 QuoteMate. Built in Australia.</p>
            </div>
        </div>
    </footer>
    <script src="/js/main.js"></script>
</body>
</html>`;
}

function breadcrumbs(items) {
    const crumbs = [{ label: 'Home', href: '/' }, ...items];
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': crumbs.map((c, i) => ({
            '@type': 'ListItem',
            'position': i + 1,
            'name': c.label,
            'item': c.href ? `${site.url}${c.href}` : undefined
        }))
    };
    return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
        <ol>
            ${crumbs.map((c, i) => i < crumbs.length - 1
                ? `<li><a href="${c.href}">${escHtml(c.label)}</a></li>`
                : `<li aria-current="page">${escHtml(c.label)}</li>`
            ).join('\n            ')}
        </ol>
    </nav>
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

function internalLinks(currentTradeSlug, currentCitySlug) {
    // Related trade pages
    const otherTrades = trades.filter(t => t.slug !== currentTradeSlug).slice(0, 8);
    const relatedCities = currentCitySlug
        ? cities.filter(c => c.slug !== currentCitySlug).slice(0, 6)
        : cities.slice(0, 6);

    let html = `
        <section class="seo-internal-links">
            <div class="container">
                <div class="links-grid">
                    <div class="links-column">
                        <h3>Quoting Apps by Trade</h3>
                        <ul>
                            ${otherTrades.map(t => `<li><a href="/pages/quotes-for-${t.slug}/">Quotes for ${t.name}</a></li>`).join('\n                            ')}
                        </ul>
                    </div>`;

    if (currentTradeSlug) {
        const trade = trades.find(t => t.slug === currentTradeSlug);
        if (trade) {
            html += `
                    <div class="links-column">
                        <h3>${trade.name} Quoting by City</h3>
                        <ul>
                            ${relatedCities.map(c => `<li><a href="/pages/quotes-for-${currentTradeSlug}-${c.slug}/">${trade.singular} Quotes in ${c.name}</a></li>`).join('\n                            ')}
                        </ul>
                    </div>`;
        }
    }

    // Related templates
    const templates = quoteTemplates.slice(0, 6);
    html += `
                    <div class="links-column">
                        <h3>Free Quote Templates</h3>
                        <ul>
                            ${templates.map(t => `<li><a href="/pages/templates/${t.slug}/">${t.name}</a></li>`).join('\n                            ')}
                        </ul>
                    </div>`;

    // Related guides
    if (guides && guides.length > 0) {
        const relatedGuides = currentTradeSlug
            ? guides.filter(g => g.trade === currentTradeSlug).slice(0, 4).concat(guides.filter(g => g.trade !== currentTradeSlug).slice(0, 6 - Math.min(4, guides.filter(g => g.trade === currentTradeSlug).length)))
            : guides.slice(0, 6);
        html += `
                    <div class="links-column">
                        <h3>Quoting Guides</h3>
                        <ul>
                            ${relatedGuides.slice(0, 6).map(g => `<li><a href="/pages/guides/${g.slug}/">${g.title.replace(' in Australia', '')}</a></li>`).join('\n                            ')}
                        </ul>
                    </div>`;
    }

    html += `
                </div>
            </div>
        </section>`;

    return html;
}

// ─── Page generators ───────────────────────────────────────────────────────

function generateTradePage(trade) {
    const slug = `quotes-for-${trade.slug}`;
    const canonical = `${site.url}/pages/${slug}/`;
    const title = `${trade.singular} Quoting App — Professional Quotes for ${trade.name} | QuoteMate`;
    const description = trade.description.length > 155 ? trade.description.substring(0, trade.description.lastIndexOf(' ', 155)) + '.' : trade.description;

    const faqItems = [
        {
            q: `How does QuoteMate help ${trade.name.toLowerCase()}?`,
            a: `QuoteMate is an AI-powered quoting app that helps ${trade.name.toLowerCase()} create professional quotes in under 2 minutes. Describe any ${trade.keyword.toLowerCase()} job, and the AI suggests materials with real-time pricing from major Australian suppliers. Send branded PDF quotes via email, SMS, or WhatsApp.`
        },
        {
            q: `What ${trade.keyword.toLowerCase()} jobs can I quote with QuoteMate?`,
            a: `QuoteMate covers all types of ${trade.keyword.toLowerCase()} jobs including ${trade.commonJobs.map(j => typeof j === 'object' ? j.name : j).join(', ')}. You can also describe any custom job and the AI will suggest appropriate materials and quantities.`
        },
        {
            q: `How much do ${trade.name.toLowerCase()} typically quote?`,
            a: `${trade.name} typically quote between ${trade.avgQuoteRange} depending on the scope of work. QuoteMate ensures every quote is accurate with real-time material pricing and proper GST calculations.`
        },
        {
            q: `Is QuoteMate free for ${trade.name.toLowerCase()}?`,
            a: `QuoteMate offers a free 7-day trial so you can create quotes immediately — no credit card required. Pro plans start at $29/month or $199/year (save 43%) for unlimited quotes, invoicing, and all premium features.`
        }
    ];

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqItems.map(f => ({
            '@type': 'Question',
            'name': f.q,
            'acceptedAnswer': { '@type': 'Answer', 'text': f.a }
        }))
    };

    const html = `${htmlHead({ title, description, canonical })}
${header()}
    <main>
        <section class="seo-hero">
            <div class="container">
                ${breadcrumbs([
                    { label: 'Trades', href: '/pages/' },
                    { label: `Quotes for ${trade.name}` }
                ])}
                <div class="seo-hero-content">
                    <span class="seo-badge">${trade.keyword} Quoting App</span>
                    <h1 class="seo-hero-title">${trade.heroTitle} with <span class="text-gradient">QuoteMate</span></h1>
                    <p class="seo-hero-subtitle">${trade.description}</p>
                    <div class="hero-ctas">
                        <a href="${site.appStoreUrl}" class="btn btn-store">
                            <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
                            <span><small>Download on the</small>App Store</span>
                        </a>
                        <a href="${site.playStoreUrl}" class="btn btn-store">
                            <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
                            <span><small>Get it on</small>Google Play</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <section class="seo-pain-point">
            <div class="container">
                <div class="pain-point-card">
                    <h2>${trade.painPoint}</h2>
                    <p>QuoteMate's AI handles the tedious parts of quoting so you can focus on what you do best — the actual work.</p>
                </div>
            </div>
        </section>

        <section class="seo-features">
            <div class="container">
                <h2 class="section-title">Built for <span class="text-gradient">${trade.name}</span></h2>
                <div class="seo-features-grid">
                    ${trade.features.map(f => `
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${escHtml(f)}</span>
                    </div>`).join('')}
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Real-time supplier pricing</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Professional PDF quotes with your logo &amp; ABN</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>GST calculations and invoice tracking</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Works offline — perfect for remote job sites</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="seo-example">
            <div class="container">
                <h2 class="section-title">Example <span class="text-gradient">${trade.keyword}</span> Quote</h2>
                <div class="example-card">
                    <div class="example-prompt">
                        <span class="example-label">You type:</span>
                        <p>"${escHtml(trade.templateSnippet)}"</p>
                    </div>
                    <div class="example-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                    </div>
                    <div class="example-result">
                        <span class="example-label">QuoteMate generates:</span>
                        <p>A complete material list with quantities, real-time supplier pricing, your labour rate, GST, and a professional branded PDF — ready to send.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="seo-common-jobs">
            <div class="container">
                <h2 class="section-title">Common <span class="text-gradient">${trade.keyword}</span> Jobs You Can Quote</h2>
                <p class="section-subtitle">Describe any job below and QuoteMate will generate a full material list with real-time pricing.</p>
                <div class="jobs-list">
                    ${trade.commonJobs.map(job => {
                        const j = typeof job === 'object' ? job : { name: job };
                        return `
                    <div class="job-list-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <div>
                            <h3>${escHtml(j.name)}</h3>${j.desc ? `\n                            <p>${escHtml(j.desc)}</p>` : ''}
                        </div>
                    </div>`;
                    }).join('')}
                </div>
            </div>
        </section>

        <section class="seo-faq">
            <div class="container">
                <h2 class="section-title">Frequently Asked <span class="text-gradient">Questions</span></h2>
                <div class="faq-list">
                    ${faqItems.map(f => `
                    <div class="faq-item">
                        <button class="faq-question" aria-expanded="false">
                            <span>${escHtml(f.q)}</span>
                            <svg class="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <div class="faq-answer" role="region">
                            <p>${escHtml(f.a)}</p>
                        </div>
                    </div>`).join('')}
                </div>
                <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
            </div>
        </section>

        ${ctaSection()}
        ${internalLinks(trade.slug, null)}
    </main>
${footer()}`;

    const dir = path.join(OUTPUT_DIR, slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return canonical;
}

function generateTradeCityPage(trade, city) {
    const slug = `quotes-for-${trade.slug}-${city.slug}`;
    const canonical = `${site.url}/pages/${slug}/`;
    const title = `${trade.singular} Quoting App ${city.name} — Quotes for ${trade.name} in ${city.name} ${city.state} | QuoteMate`;
    const description = `${trade.name} in ${city.name}: create professional ${trade.keyword.toLowerCase()} quotes in under 2 minutes. AI-powered with real-time supplier pricing. Built for Australian tradies.`;

    const html = `${htmlHead({ title, description, canonical })}
${header()}
    <main>
        <section class="seo-hero">
            <div class="container">
                ${breadcrumbs([
                    { label: 'Trades', href: '/pages/' },
                    { label: `Quotes for ${trade.name}`, href: `/pages/quotes-for-${trade.slug}/` },
                    { label: city.name }
                ])}
                <div class="seo-hero-content">
                    <span class="seo-badge">${trade.keyword} Quoting &bull; ${city.name} ${city.state}</span>
                    <h1 class="seo-hero-title">${trade.singular} Quoting App for <span class="text-gradient">${city.name} Tradies</span></h1>
                    <p class="seo-hero-subtitle">The #1 quoting app for ${trade.name.toLowerCase()} in ${city.name}. ${trade.description}</p>
                    <div class="hero-ctas">
                        <a href="${site.appStoreUrl}" class="btn btn-store">
                            <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
                            <span><small>Download on the</small>App Store</span>
                        </a>
                        <a href="${site.playStoreUrl}" class="btn btn-store">
                            <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
                            <span><small>Get it on</small>Google Play</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <section class="seo-local">
            <div class="container">
                <div class="local-card">
                    <h2>Serving ${trade.name} Across ${city.name}</h2>
                    <p>${city.localNote} — QuoteMate helps ${trade.name.toLowerCase()} across the entire ${city.name} metro area create professional quotes with accurate, up-to-date material pricing.</p>
                    <p>With a population of ${city.population}, ${city.name} has strong demand for quality ${trade.keyword.toLowerCase()} services. Stand out from competitors with professional, branded quotes that win more jobs.</p>
                </div>
            </div>
        </section>

        <section class="seo-features">
            <div class="container">
                <h2 class="section-title">Why ${city.name} ${trade.name} Choose <span class="text-gradient">QuoteMate</span></h2>
                <div class="seo-features-grid">
                    ${trade.features.map(f => `
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${escHtml(f)}</span>
                    </div>`).join('')}
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Real-time supplier pricing</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Professional PDF quotes with your logo &amp; ABN</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>GST calculations and invoice tracking</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Works offline — perfect for remote ${city.name} job sites</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="seo-common-jobs">
            <div class="container">
                <h2 class="section-title">Popular ${trade.keyword} Jobs in <span class="text-gradient">${city.name}</span></h2>
                <p class="section-subtitle">Describe any job below and QuoteMate will generate a full material list with local ${city.name} pricing.</p>
                <div class="jobs-list">
                    ${trade.commonJobs.map(job => {
                        const j = typeof job === 'object' ? job : { name: job };
                        return `
                    <div class="job-list-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <div>
                            <h3>${escHtml(j.name)}</h3>${j.desc ? `\n                            <p>${escHtml(j.desc)}</p>` : ''}
                        </div>
                    </div>`;
                    }).join('')}
                </div>
            </div>
        </section>

        ${ctaSection()}
        ${internalLinks(trade.slug, city.slug)}
    </main>
${footer()}`;

    const dir = path.join(OUTPUT_DIR, slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return canonical;
}

function generateTemplatePage(template) {
    const canonical = `${site.url}/pages/templates/${template.slug}/`;
    const title = `Free ${template.name} Australia — Download & Customise | QuoteMate`;
    const description = template.description;
    const trade = trades.find(t => t.slug === template.trade);

    const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': `How to Create a ${template.name}`,
        'description': template.description,
        'step': template.steps.map((s, i) => ({
            '@type': 'HowToStep',
            'position': i + 1,
            'text': s
        }))
    };

    const html = `${htmlHead({ title, description, canonical })}
${header()}
    <main>
        <section class="seo-hero">
            <div class="container">
                ${breadcrumbs([
                    { label: 'Templates', href: '/pages/templates/' },
                    { label: template.name }
                ])}
                <div class="seo-hero-content">
                    <span class="seo-badge">Free Template</span>
                    <h1 class="seo-hero-title">Free <span class="text-gradient">${template.name}</span></h1>
                    <p class="seo-hero-subtitle">${escHtml(template.description)}</p>
                    <div class="hero-ctas">
                        <a href="${site.appStoreUrl}" class="btn btn-store">
                            <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
                            <span><small>Download on the</small>App Store</span>
                        </a>
                        <a href="${site.playStoreUrl}" class="btn btn-store">
                            <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
                            <span><small>Get it on</small>Google Play</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <section class="seo-template-details">
            <div class="container">
                <div class="template-grid">
                    <div class="template-materials">
                        <h2>What's Included in This Template</h2>
                        <ul>
                            ${template.materials.map(m => `
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                                ${escHtml(m)}
                            </li>`).join('')}
                        </ul>
                    </div>
                    <div class="template-steps">
                        <h2>How to Create Your Quote</h2>
                        <ol>
                            ${template.steps.map((s, i) => `
                            <li>
                                <span class="step-num">${i + 1}</span>
                                <span>${escHtml(s)}</span>
                            </li>`).join('')}
                        </ol>
                    </div>
                </div>
                <script type="application/ld+json">${JSON.stringify(howToSchema)}</script>
            </div>
        </section>

        <section class="seo-features">
            <div class="container">
                <h2 class="section-title">Why Use QuoteMate for Your <span class="text-gradient">${template.name.replace(' Template', '')}</span></h2>
                <div class="seo-features-grid">
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>AI auto-generates materials and quantities</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Real-time supplier pricing</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Professional branded PDF with your logo</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>GST, ABN, and payment terms included</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Send via email, SMS, or WhatsApp</span>
                    </div>
                    <div class="seo-feature-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Convert to invoice with one tap</span>
                    </div>
                </div>
            </div>
        </section>

        ${ctaSection()}
        ${internalLinks(trade ? trade.slug : null, null)}
    </main>
${footer()}`;

    const dir = path.join(OUTPUT_DIR, 'templates', template.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return canonical;
}

function generateIndexPage() {
    const canonical = `${site.url}/pages/`;
    const title = `Quoting Apps by Trade — Professional Quotes for Every Australian Trade | QuoteMate`;
    const description = `Find the perfect quoting solution for your trade. QuoteMate helps electricians, plumbers, carpenters, builders, and 20+ other trades create professional quotes with AI-powered material pricing.`;

    const html = `${htmlHead({ title, description, canonical })}
${header()}
    <main>
        <section class="seo-hero">
            <div class="container">
                ${breadcrumbs([{ label: 'All Trades' }])}
                <div class="seo-hero-content">
                    <h1 class="seo-hero-title">Quoting Apps for <span class="text-gradient">Every Trade</span></h1>
                    <p class="seo-hero-subtitle">QuoteMate helps Australian tradies across 24+ trades create professional quotes in under 2 minutes with AI-powered material pricing from major Australian suppliers.</p>
                </div>
            </div>
        </section>

        <section class="seo-trade-directory">
            <div class="container">
                <div class="trade-directory-grid">
                    ${trades.map(t => `
                    <a href="/pages/quotes-for-${t.slug}/" class="trade-directory-card">
                        <h2>Quotes for ${t.name}</h2>
                        <p>${t.description.substring(0, 100)}...</p>
                        <span class="trade-directory-link">Learn more &rarr;</span>
                    </a>`).join('')}
                </div>
            </div>
        </section>

        <section class="seo-template-directory">
            <div class="container">
                <h2 class="section-title">Free <span class="text-gradient">Quote Templates</span></h2>
                <div class="trade-directory-grid">
                    ${quoteTemplates.map(t => `
                    <a href="/pages/templates/${t.slug}/" class="trade-directory-card">
                        <h2>${t.name}</h2>
                        <p>${t.description.substring(0, 100)}...</p>
                        <span class="trade-directory-link">Use template &rarr;</span>
                    </a>`).join('')}
                </div>
            </div>
        </section>

        ${ctaSection()}
    </main>
${footer()}`;

    ensureDir(OUTPUT_DIR);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
    return canonical;
}

function generateTemplatesIndex() {
    const canonical = `${site.url}/pages/templates/`;
    const title = `Free Quote Templates for Australian Tradies | QuoteMate`;
    const description = `Download free quote templates for decks, bathrooms, kitchens, fences, painting, solar, and more. Customise with your branding and send professional quotes in minutes.`;

    const html = `${htmlHead({ title, description, canonical })}
${header()}
    <main>
        <section class="seo-hero">
            <div class="container">
                ${breadcrumbs([
                    { label: 'Trades', href: '/pages/' },
                    { label: 'Quote Templates' }
                ])}
                <div class="seo-hero-content">
                    <h1 class="seo-hero-title">Free <span class="text-gradient">Quote Templates</span> for Tradies</h1>
                    <p class="seo-hero-subtitle">Professional quote templates with AI-powered material lists, real-time pricing, and your business branding. Customise and send in under 2 minutes.</p>
                </div>
            </div>
        </section>

        <section class="seo-template-directory">
            <div class="container">
                <div class="trade-directory-grid">
                    ${quoteTemplates.map(t => `
                    <a href="/pages/templates/${t.slug}/" class="trade-directory-card">
                        <h2>${t.name}</h2>
                        <p>${t.description.substring(0, 120)}...</p>
                        <span class="trade-directory-link">Use template &rarr;</span>
                    </a>`).join('')}
                </div>
            </div>
        </section>

        ${ctaSection()}
    </main>
${footer()}`;

    const dir = path.join(OUTPUT_DIR, 'templates');
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return canonical;
}

// ─── Guide page generators ─────────────────────────────────────────────────

function generateGuidePage(guide) {
    const canonical = `${site.url}/pages/guides/${guide.slug}/`;
    const title = `${guide.title} | QuoteMate`;
    const description = guide.description;
    const trade = trades.find(t => t.slug === guide.trade);
    const relatedTemplate = quoteTemplates.find(t => t.slug === guide.relatedTemplate);

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': guide.title,
        'description': guide.description,
        'author': { '@type': 'Organization', 'name': 'QuoteMate', 'url': site.url },
        'publisher': { '@type': 'Organization', 'name': 'QuoteMate', 'url': site.url },
        'mainEntityOfPage': canonical
    };

    const html = `${htmlHead({ title, description, canonical })}
${header()}
    <main>
        <section class="seo-hero">
            <div class="container">
                ${breadcrumbs([
                    { label: 'Guides', href: '/pages/guides/' },
                    { label: guide.title.replace(' in Australia', '') }
                ])}
                <div class="seo-hero-content">
                    <span class="seo-badge">Quoting Guide${trade ? ` — ${trade.keyword}` : ''}</span>
                    <h1 class="seo-hero-title">${escHtml(guide.title.replace(' in Australia', ''))} <span class="text-gradient">in Australia</span></h1>
                    <p class="seo-hero-subtitle">${escHtml(guide.description)}</p>
                </div>
                <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
            </div>
        </section>

        <article class="seo-guide-article">
            <div class="container">
                <div class="guide-content">
                    ${guide.sections.map(s => `
                    <section class="guide-section">
                        <h2>${escHtml(s.heading)}</h2>
                        <p>${escHtml(s.body)}</p>
                    </section>`).join('')}

                    <section class="guide-section guide-tips">
                        <h2>Quick Tips Checklist</h2>
                        <ul class="guide-tip-list">
                            ${guide.tips.map(tip => `
                            <li>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>${escHtml(tip)}</span>
                            </li>`).join('')}
                        </ul>
                    </section>

                    <section class="guide-section guide-cta-inline">
                        <div class="guide-cta-card">
                            <h2>Skip the Manual Quoting</h2>
                            <p>QuoteMate does all of this in under 2 minutes. Describe any job, get AI-powered material lists with real-time supplier pricing, and send a professional PDF quote — all from your phone.</p>
                            <div class="hero-ctas">
                                <a href="${site.appStoreUrl}" class="btn btn-store">
                                    <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
                                    <span><small>Download on the</small>App Store</span>
                                </a>
                                <a href="${site.playStoreUrl}" class="btn btn-store">
                                    <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
                                    <span><small>Get it on</small>Google Play</span>
                                </a>
                            </div>
                        </div>
                    </section>

                    ${relatedTemplate ? `
                    <section class="guide-section">
                        <h2>Related Template</h2>
                        <a href="/pages/templates/${relatedTemplate.slug}/" class="trade-directory-card" style="max-width:480px;">
                            <h3>${relatedTemplate.name}</h3>
                            <p>${relatedTemplate.description.substring(0, 120)}...</p>
                            <span class="trade-directory-link">Use this template &rarr;</span>
                        </a>
                    </section>` : ''}
                </div>
            </div>
        </article>

        ${ctaSection()}
        ${internalLinks(guide.trade, null)}
    </main>
${footer()}`;

    const dir = path.join(OUTPUT_DIR, 'guides', guide.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return canonical;
}

function generateGuidesIndex() {
    const canonical = `${site.url}/pages/guides/`;
    const title = `How to Quote Any Trade Job — Quoting Guides for Australian Tradies | QuoteMate`;
    const description = `Step-by-step quoting guides for Australian tradies. Learn how to quote bathroom renovations, deck builds, fencing, painting, electrical, plumbing, and more with accurate pricing.`;

    const html = `${htmlHead({ title, description, canonical })}
${header()}
    <main>
        <section class="seo-hero">
            <div class="container">
                ${breadcrumbs([
                    { label: 'Trades', href: '/pages/' },
                    { label: 'Quoting Guides' }
                ])}
                <div class="seo-hero-content">
                    <h1 class="seo-hero-title">How to Quote <span class="text-gradient">Any Trade Job</span></h1>
                    <p class="seo-hero-subtitle">Step-by-step quoting guides written for Australian tradies. Learn what to include, how to price materials and labour, and common mistakes to avoid — so you never underquote again.</p>
                </div>
            </div>
        </section>

        <section class="seo-trade-directory">
            <div class="container">
                <div class="trade-directory-grid">
                    ${guides.map(g => `
                    <a href="/pages/guides/${g.slug}/" class="trade-directory-card">
                        <h2>${g.title.replace(' in Australia', '')}</h2>
                        <p>${g.description.substring(0, 110)}...</p>
                        <span class="trade-directory-link">Read guide &rarr;</span>
                    </a>`).join('')}
                </div>
            </div>
        </section>

        ${ctaSection()}
    </main>
${footer()}`;

    const dir = path.join(OUTPUT_DIR, 'guides');
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    return canonical;
}

// ─── Sitemap generation ────────────────────────────────────────────────────

function generateSitemap(urls) {
    const today = new Date().toISOString().split('T')[0];
    const entries = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq || 'monthly'}</changefreq>
    <priority>${u.priority || '0.7'}</priority>
  </url>`);

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${site.url}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${entries.join('\n')}
</urlset>`;
}

// ─── Robots.txt ────────────────────────────────────────────────────────────

function generateRobotsTxt() {
    return `User-agent: *
Allow: /

Sitemap: ${site.url}/sitemap.xml
`;
}

// ─── Utils ─────────────────────────────────────────────────────────────────

function escHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Main build ────────────────────────────────────────────────────────────

function build() {
    console.log('Building programmatic SEO pages...\n');

    const allUrls = [];

    // Index pages
    console.log('Generating index pages...');
    allUrls.push({ loc: generateIndexPage(), priority: '0.8', changefreq: 'weekly' });
    allUrls.push({ loc: generateTemplatesIndex(), priority: '0.8', changefreq: 'weekly' });

    // Tier 1: Trade pages
    console.log(`Generating ${trades.length} trade pages...`);
    for (const trade of trades) {
        const url = generateTradePage(trade);
        allUrls.push({ loc: url, priority: '0.8', changefreq: 'monthly' });
    }

    // Tier 2: Trade + City pages
    const cityPageCount = trades.length * cities.length;
    console.log(`Generating ${cityPageCount} trade+city pages...`);
    for (const trade of trades) {
        for (const city of cities) {
            const url = generateTradeCityPage(trade, city);
            allUrls.push({ loc: url, priority: '0.7', changefreq: 'monthly' });
        }
    }

    // Tier 3: Template pages
    console.log(`Generating ${quoteTemplates.length} template pages...`);
    for (const template of quoteTemplates) {
        const url = generateTemplatePage(template);
        allUrls.push({ loc: url, priority: '0.7', changefreq: 'monthly' });
    }

    // Tier 4: Guide pages
    const guideCount = guides ? guides.length : 0;
    if (guides && guides.length > 0) {
        console.log(`Generating ${guideCount} guide pages...`);
        allUrls.push({ loc: generateGuidesIndex(), priority: '0.8', changefreq: 'weekly' });
        for (const guide of guides) {
            const url = generateGuidePage(guide);
            allUrls.push({ loc: url, priority: '0.8', changefreq: 'monthly' });
        }
    }

    // Generate sitemap
    const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, generateSitemap(allUrls));

    // Generate robots.txt
    const robotsPath = path.join(__dirname, '..', 'robots.txt');
    fs.writeFileSync(robotsPath, generateRobotsTxt());

    console.log(`\nBuild complete!`);
    console.log(`  Trade pages:      ${trades.length}`);
    console.log(`  Trade+City pages: ${cityPageCount}`);
    console.log(`  Template pages:   ${quoteTemplates.length}`);
    console.log(`  Guide pages:      ${guideCount}`);
    console.log(`  Index pages:      3`);
    console.log(`  ─────────────────────`);
    console.log(`  Total pages:      ${allUrls.length + 1}`);
    console.log(`  Sitemap:          sitemap.xml`);
    console.log(`  Robots.txt:       robots.txt`);
}

build();
