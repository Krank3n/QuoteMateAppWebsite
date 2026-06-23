'use client';

import { useEffect, useRef } from 'react';

interface WalkthroughPlayerProps {
  /** Folder under /assets/videos (e.g. 'templates'). */
  basePath: string;
  /** File base name (without extension). */
  slug: string;
  poster?: string;
  label?: string;
}

// Reusable phone-mockup video player — identical markup, styling (.qm-walk-player
// in globals.css) and behaviour to the home-screen walkthrough player, but
// self-contained (ref-scoped, multi-instance safe) so it works on any page.
export default function WalkthroughPlayer({ basePath, slug, poster, label }: WalkthroughPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const box = v.parentNode as HTMLElement;
    if (!box) return;

    const overlay = box.querySelector<HTMLElement>('.video-paused-overlay');
    const controls = box.querySelector<HTMLElement>('.video-controls');
    const progress = box.querySelector<HTMLElement>('.video-progress');
    const track = box.querySelector<HTMLElement>('.video-progress-track');
    const fill = box.querySelector<HTMLElement>('.video-progress-fill');
    const thumb = box.querySelector<HTMLElement>('.video-progress-thumb');
    const hint = box.querySelector<HTMLElement>('.tap-for-sound');

    let activated = false;
    let paused = false;
    let dragging = false;
    const cleanups: Array<() => void> = [];

    const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    const render = () => {
      const show = activated && paused;
      if (controls) controls.classList.toggle('video-controls--visible', show);
      if (progress) progress.classList.toggle('video-progress--visible', show);
      if (overlay) overlay.style.display = show ? 'block' : 'none';
      if (hint) hint.style.display = activated ? 'none' : '';
    };

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { play(); paused = false; } else { v.pause(); }
          render();
        });
      }, { threshold: 0.25 });
      io.observe(v);
    } else {
      play();
    }

    const onTime = () => {
      if (!dragging && v.duration) {
        const pct = (v.currentTime / v.duration) * 100;
        if (fill) fill.style.width = pct + '%';
        if (thumb) thumb.style.left = pct + '%';
      }
    };
    v.addEventListener('timeupdate', onTime);

    const onBoxClick = () => {
      if (!activated) { v.muted = false; play(); activated = true; paused = false; render(); return; }
      if (v.paused) { play(); paused = false; } else { v.pause(); paused = true; }
      render();
    };
    box.addEventListener('click', onBoxClick);

    const bind = (a: string, fn: () => void) => {
      const b = box.querySelector<HTMLElement>(`[data-a="${a}"]`);
      if (!b) return;
      const h = (e: Event) => { e.stopPropagation(); fn(); render(); };
      b.addEventListener('click', h);
      cleanups.push(() => b.removeEventListener('click', h));
    };
    bind('play', () => { play(); paused = false; });
    bind('reset', () => { v.currentTime = 0; play(); paused = false; });
    bind('mute', () => { v.muted = true; activated = false; paused = false; play(); });
    bind('full', () => {
      const vid = v as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
      if (vid.requestFullscreen) vid.requestFullscreen();
      else if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen();
    });

    const seek = (x: number) => {
      if (!v.duration || !track) return;
      const r = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (x - r.left) / r.width));
      v.currentTime = ratio * v.duration;
      if (fill) fill.style.width = ratio * 100 + '%';
      if (thumb) thumb.style.left = ratio * 100 + '%';
    };

    if (progress) {
      const stop = (e: Event) => e.stopPropagation();
      progress.addEventListener('click', stop);
      const down = (e: MouseEvent | TouchEvent) => {
        e.stopPropagation();
        dragging = true;
        const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
        seek(x);
        const mv = (ev: MouseEvent | TouchEvent) => {
          const mx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
          seek(mx);
        };
        const up = () => {
          dragging = false;
          window.removeEventListener('mousemove', mv as EventListener);
          window.removeEventListener('mouseup', up);
          window.removeEventListener('touchmove', mv as EventListener);
          window.removeEventListener('touchend', up);
        };
        window.addEventListener('mousemove', mv as EventListener);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchmove', mv as EventListener);
        window.addEventListener('touchend', up);
      };
      progress.addEventListener('mousedown', down as EventListener);
      progress.addEventListener('touchstart', down as EventListener, { passive: true });
      cleanups.push(() => {
        progress.removeEventListener('click', stop);
        progress.removeEventListener('mousedown', down as EventListener);
        progress.removeEventListener('touchstart', down as EventListener);
      });
    }

    render();

    return () => {
      io?.disconnect();
      v.removeEventListener('timeupdate', onTime);
      box.removeEventListener('click', onBoxClick);
      cleanups.forEach((c) => c());
    };
  }, [basePath, slug]);

  return (
    <div className="qm-walk-player">
      <div className="phone">
        <div className="notch"></div>
        <div className="screen">
          <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" poster={poster} aria-label={label}>
            <source src={`/assets/videos/${basePath}/${slug}.webm`} type="video/webm" />
            <source src={`/assets/videos/${basePath}/${slug}.mp4`} type="video/mp4" />
          </video>
          <div className="video-paused-overlay" style={{ display: 'none' }}></div>
          <div className="video-controls">
            <button className="vc-btn" data-a="play" aria-label="Play">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3" /></svg>
            </button>
            <button className="vc-btn" data-a="reset" aria-label="Restart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button className="vc-btn" data-a="mute" aria-label="Mute">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            </button>
            <button className="vc-btn" data-a="full" aria-label="Fullscreen">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          </div>
          <div className="video-progress">
            <div className="video-progress-track">
              <div className="video-progress-fill"></div>
              <div className="video-progress-thumb"></div>
            </div>
          </div>
          <div className="tap-for-sound">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            <span>Tap for sound</span>
          </div>
        </div>
      </div>
    </div>
  );
}
