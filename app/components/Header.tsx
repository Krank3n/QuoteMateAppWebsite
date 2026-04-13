'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  homeLinks?: boolean;
}

export default function Header({ homeLinks = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefix = homeLinks ? '/' : '';

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function closeMenu() {
    setMobileOpen(false);
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    const next = !mobileOpen;
    setMobileOpen(next);
    document.body.style.overflow = next ? 'hidden' : '';
  }

  return (
    <>
      <header className={`site-header${scrolled ? ' scrolled' : ''}`} id="site-header">
        <nav className="nav-container" aria-label="Main navigation">
          <Link href="/" className="logo" aria-label="QuoteMate home" onClick={closeMenu}>
            <Image className="logo-icon" src="/assets/logo.png" alt="QuoteMate logo" width={36} height={36} />
            <span className="logo-text">Quote<span className="logo-accent">Mate</span></span>
          </Link>

          <ul className="nav-links" id="nav-links" role="menubar">
            <li role="none"><Link href={`${prefix}#features`} role="menuitem">Features</Link></li>
            <li role="none"><Link href={`${prefix}#how-it-works`} role="menuitem">How It Works</Link></li>
            <li role="none"><Link href={`${prefix}#pricing`} role="menuitem">Pricing</Link></li>
            <li role="none"><Link href={`${prefix}#trades`} role="menuitem">Trades</Link></li>
            <li role="none"><Link href={`${prefix}#faq`} role="menuitem">FAQ</Link></li>
            <li role="none"><Link href="/articles" role="menuitem">Articles</Link></li>
          </ul>

          <div className="nav-cta-group">
            <Link href="/portal" className="btn btn-secondary nav-cta">Supplier Portal</Link>
            <Link href={`${prefix}#download`} className="btn btn-primary nav-cta">Download App</Link>
          </div>

          <button
            className={`mobile-menu-toggle${mobileOpen ? ' active' : ''}`}
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={toggleMenu}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </nav>
      </header>

      {mobileOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}>
          <nav aria-label="Mobile navigation" onClick={(e) => e.stopPropagation()}>
            <ul role="menubar">
              <li role="none"><Link href={`${prefix}#features`} role="menuitem" onClick={closeMenu}>Features</Link></li>
              <li role="none"><Link href={`${prefix}#how-it-works`} role="menuitem" onClick={closeMenu}>How It Works</Link></li>
              <li role="none"><Link href={`${prefix}#pricing`} role="menuitem" onClick={closeMenu}>Pricing</Link></li>
              <li role="none"><Link href={`${prefix}#trades`} role="menuitem" onClick={closeMenu}>Trades</Link></li>
              <li role="none"><Link href={`${prefix}#faq`} role="menuitem" onClick={closeMenu}>FAQ</Link></li>
              <li role="none"><Link href="/articles" role="menuitem" onClick={closeMenu}>Articles</Link></li>
            </ul>
            <div className="mobile-cta-group">
              <Link href="/portal" className="btn btn-secondary" onClick={closeMenu}>Supplier Portal</Link>
              <Link href={`${prefix}#download`} className="btn btn-primary" onClick={closeMenu}>Download App</Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
