interface CTAButtonsProps {
  className?: string;
  showWebLink?: boolean;
}

export default function CTAButtons({ className = '', showWebLink = false }: CTAButtonsProps) {
  return (
    <>
      <div className={`hero-ctas ${className}`}>
        <a href="https://apps.apple.com/au/app/quotemate/id6754000046" className="btn btn-store" aria-label="Download QuoteMate on the App Store" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
          <span>
            <small>Download on the</small>
            App Store
          </span>
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU" className="btn btn-store" aria-label="Get it on Google Play">
          <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
          <span>
            <small>Get it on</small>
            Google Play
          </span>
        </a>
      </div>
      {showWebLink && <a href="/app" className="hero-web-link">Or try it on the web &rarr;</a>}
    </>
  );
}
