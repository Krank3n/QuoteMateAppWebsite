'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface HelpClip {
  href: string;
  poster: string;
  title: string;
  seconds: number;
}

// "Watch it done" strip on the Help Centre index: a horizontal carousel of
// phone clips on the homepage hero's engineered background. Drag with the
// mouse (grab cursor, momentum), swipe on touch, arrows, keyboard, and
// scroll-snap per clip. A drag never fires the link click underneath.
export default function HelpClipCarousel({ clips }: { clips: HelpClip[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0, lastX: 0, lastT: 0, vx: 0 });
  const raf = useRef(0);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges]);

  function stopMomentum() {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = 0;
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return; // touch scrolls natively
    const el = trackRef.current;
    if (!el) return;
    stopMomentum();
    el.style.scrollSnapType = 'none';
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), vx: 0 };
    // No pointer capture yet: capturing here would retarget the click, so a
    // plain click on a clip would never reach its link.
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = trackRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 4) {
      d.moved = true;
      setDragging(true);
      el.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    el.scrollLeft = d.startLeft - dx;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.vx = (e.clientX - d.lastX) / dt; // px per ms
    d.lastX = e.clientX;
    d.lastT = now;
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = trackRef.current;
    if (!d.active || !el) return;
    d.active = false;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    if (!d.moved) { el.style.scrollSnapType = ''; return; }
    // Momentum, then hand back to scroll-snap so the strip settles on a clip.
    let v = d.vx * 16; // px per frame at ~60fps
    const step = () => {
      if (Math.abs(v) < 0.5) {
        el.style.scrollSnapType = '';
        raf.current = 0;
        setDragging(false);
        return;
      }
      el.scrollLeft -= v;
      v *= 0.92;
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  function page(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    stopMomentum();
    el.style.scrollSnapType = '';
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <div className={`help-carousel${dragging ? ' is-dragging' : ''}${atStart ? ' at-start' : ''}${atEnd ? ' at-end' : ''}`}>
      <div
        ref={trackRef}
        className="help-watch-grid"
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        {clips.map((clip) => (
          <Link key={clip.href} href={clip.href} className="help-watch-card" draggable={false}>
            <span className="help-watch-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={clip.poster} alt="" loading="lazy" width={300} height={652} draggable={false} />
              <span className="help-watch-play" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3" /></svg>
              </span>
              <span className="help-watch-len">{clip.seconds}s</span>
            </span>
            <span className="help-watch-title">{clip.title}</span>
          </Link>
        ))}
      </div>
      <button type="button" className="help-carousel-btn prev" onClick={() => page(-1)} disabled={atStart} aria-label="Previous clips">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button type="button" className="help-carousel-btn next" onClick={() => page(1)} disabled={atEnd} aria-label="Next clips">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      </button>
    </div>
  );
}
