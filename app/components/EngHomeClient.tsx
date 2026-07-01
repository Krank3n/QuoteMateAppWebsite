'use client';

import { useEffect } from 'react';

export default function EngHomeClient() {
  useEffect(() => {
    // Video walkthrough player
    const v = document.getElementById('qm-walk') as HTMLVideoElement | null;
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

    function play() {
      const p = v!.play();
      if (p && p.catch) p.catch(() => {});
    }

    function render() {
      const show = activated && paused;
      if (controls) controls.classList.toggle('video-controls--visible', show);
      if (progress) progress.classList.toggle('video-progress--visible', show);
      if (overlay) overlay.style.display = show ? 'block' : 'none';
      if (hint) hint.style.display = activated ? 'none' : '';
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              play();
              paused = false;
            } else {
              v!.pause();
            }
            render();
          });
        },
        { threshold: 0.25 }
      ).observe(v);
    } else {
      play();
    }

    v.addEventListener('timeupdate', () => {
      if (!dragging && v.duration) {
        const pct = (v.currentTime / v.duration) * 100;
        if (fill) fill.style.width = pct + '%';
        if (thumb) thumb.style.left = pct + '%';
      }
    });

    box.addEventListener('click', () => {
      if (!activated) {
        v.muted = false;
        play();
        activated = true;
        paused = false;
        render();
        return;
      }
      if (v.paused) {
        play();
        paused = false;
      } else {
        v.pause();
        paused = true;
      }
      render();
    });

    function bind(a: string, fn: () => void) {
      const b = box.querySelector<HTMLElement>(`[data-a="${a}"]`);
      if (b)
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          fn();
          render();
        });
    }

    bind('play', () => { play(); paused = false; });
    bind('reset', () => { v!.currentTime = 0; play(); paused = false; });
    bind('mute', () => { v!.muted = true; activated = false; paused = false; play(); });
    bind('full', () => {
      const vid = v!;
      if (vid.requestFullscreen) vid.requestFullscreen();
      else if ((vid as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen)
        (vid as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    });

    function seek(x: number) {
      if (!v!.duration || !track) return;
      const r = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (x - r.left) / r.width));
      v!.currentTime = ratio * v!.duration;
      if (fill) fill.style.width = ratio * 100 + '%';
      if (thumb) thumb.style.left = ratio * 100 + '%';
    }

    if (progress) {
      progress.addEventListener('click', (e) => e.stopPropagation());

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
    }

    render();

    // Timeline seek buttons
    const rows = document.querySelectorAll<HTMLElement>('.vt[data-t]');
    rows.forEach((el) => {
      el.tabIndex = 0;
      el.setAttribute('role', 'button');

      const go = () => {
        const t = parseFloat(el.getAttribute('data-t') || '');
        if (!isNaN(t)) {
          v!.currentTime = t;
          play();
          paused = false;
          render();
        }
        rows.forEach((x) => x.classList.remove('vt-active'));
        el.classList.add('vt-active');
        v!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      });
    });

    // FAQ accordion (vanilla, matches mockup behaviour)
    const fitems = document.querySelectorAll<HTMLElement>('.eng-home .fitem');
    fitems.forEach((item) => {
      const fq = item.querySelector<HTMLElement>('.fq');
      if (!fq) return;
      fq.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // close all
        fitems.forEach((x) => {
          x.classList.remove('open');
          const pm = x.querySelector<HTMLElement>('.pm');
          if (pm) pm.textContent = '+';
        });
        if (!isOpen) {
          item.classList.add('open');
          const pm = item.querySelector<HTMLElement>('.pm');
          if (pm) pm.textContent = '−';
        }
      });
    });
  }, []);

  // ── Hero primary CTA behaviour ───────────────────────────────────────────
  // Both "Get my first quote" and the mobile "quote this up mate" bar carry
  // [data-hero-cta] and point to /app. On a real phone (iOS/Android) we
  // intercept and open the native-install prompt instead; everywhere else the
  // <a href="/app"> falls through and opens the web app. Kept in its own effect
  // so it never depends on the video wiring above.
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || '';
    const isMobileDevice = /iPad|iPhone|iPod/.test(ua) || /android/i.test(ua);
    if (!isMobileDevice) return; // desktop: let the /app link open the web app

    const ctas = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-cta]'));
    const onClick = (e: Event) => {
      e.preventDefault();
      window.dispatchEvent(new Event('qm:open-install'));
    };
    ctas.forEach((el) => el.addEventListener('click', onClick));
    return () => ctas.forEach((el) => el.removeEventListener('click', onClick));
  }, []);

  return null;
}
