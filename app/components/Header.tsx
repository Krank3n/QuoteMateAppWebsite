'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  homeLinks?: boolean;
}

// One nav for every page (the homepage included). Hash links point at
// homepage sections; `homeLinks` prefixes them with "/" off the homepage.
const NAV_LINKS: { label: string; href: string; hash?: boolean }[] = [
  { label: 'Features', href: '#features', hash: true },
  { label: 'How It Works', href: '#how-it-works', hash: true },
  { label: 'Pricing', href: '#pricing', hash: true },
  { label: 'Trades', href: '#trades', hash: true },
  { label: 'FAQ', href: '#faq', hash: true },
  { label: 'Help', href: '/help' },
  { label: 'Articles', href: '/articles' },
];

export default function Header({ homeLinks = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefix = homeLinks ? '/' : '';
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusables = Array.from(
      overlay.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    );
    focusables[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileOpen(false);
        document.body.style.overflow = '';
        return;
      }
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      toggleBtnRef.current?.focus();
    };
  }, [mobileOpen]);

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
            <Image className="logo-icon" src="/assets/logo.png" alt="QuoteMate logo" width={24} height={24} />
            <span className="logo-text">Quote<span className="logo-accent">Mate</span></span>
          </Link>

          <ul className="nav-links" id="nav-links" role="menubar">
            {NAV_LINKS.map((l) => (
              <li key={l.label} role="none"><Link href={l.hash ? `${prefix}${l.href}` : l.href} role="menuitem">{l.label}</Link></li>
            ))}
          </ul>

          <div className="nav-cta-group">
            <a href="/app" className="nav-login">Log in</a>
            <Link href="/portal" className="btn btn-secondary nav-cta">Supplier Portal</Link>
            <Link href={`${prefix}#download`} className="btn btn-primary nav-cta">Download App</Link>
          </div>

          <button
            ref={toggleBtnRef}
            className={`mobile-menu-toggle${mobileOpen ? ' active' : ''}`}
            id="mobile-menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu-overlay"
            onClick={toggleMenu}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </nav>
      </header>

      {mobileOpen && (
        <div
          ref={overlayRef}
          id="mobile-menu-overlay"
          className="mobile-menu-overlay"
          onClick={closeMenu}
        >
          <nav aria-label="Mobile navigation" onClick={(e) => e.stopPropagation()}>
            <ul role="menubar">
              {NAV_LINKS.map((l) => (
                <li key={l.label} role="none"><Link href={l.hash ? `${prefix}${l.href}` : l.href} role="menuitem" onClick={closeMenu}>{l.label}</Link></li>
              ))}
              <li role="none"><a href="/app" role="menuitem" onClick={closeMenu}>Log in</a></li>
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
