'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function WalkthroughVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      if (!isDragging && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [isDragging]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            setPaused(false);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const seekTo = useCallback((clientX: number) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !video.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio * 100);
  }, []);

  const handleProgressDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    seekTo(clientX);
    const onMove = (ev: MouseEvent | TouchEvent) => {
      const x = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      seekTo(x);
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  const handleVideoTap = () => {
    const video = videoRef.current;
    if (!video) return;

    // First tap anywhere activates sound
    if (!activated) {
      video.muted = false;
      video.play().catch(() => {});
      setActivated(true);
      setPaused(false);
      return;
    }

    // After activation, tap toggles play/pause
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
    setPaused(false);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setPaused(false);
  };

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    setActivated(false);
    setPaused(false);
    video.play().catch(() => {});
  };

  const showControls = activated && paused;

  return (
    <div className="phone-mockup">
      <div className="phone-notch"></div>
      <div className="phone-screen" onClick={handleVideoTap}>
        <video
          ref={videoRef}
          muted
          playsInline
          loop
          preload="none"
          poster="/assets/videos/walkthrough-poster.jpg"
          aria-label="Full QuoteMate app walkthrough"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <source src="/assets/videos/walkthrough.webm" type="video/webm" />
          <source src="/assets/videos/walkthrough.mp4" type="video/mp4" />
        </video>

        {/* Paused overlay */}
        {showControls && <div className="video-paused-overlay" />}

        {/* Top-right controls — visible when paused */}
        <div className={`video-controls${showControls ? ' video-controls--visible' : ''}`}>
          <button onClick={handlePlay} className="vc-btn" aria-label="Play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </button>
          <button onClick={handleReset} className="vc-btn" aria-label="Restart">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button onClick={handleMute} className="vc-btn" aria-label="Mute">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          </button>
        </div>

        {/* Progress bar — visible when paused */}
        <div
          className={`video-progress${showControls ? ' video-progress--visible' : ''}`}
          ref={progressRef}
          onMouseDown={handleProgressDown}
          onTouchStart={handleProgressDown}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="video-progress-track">
            <div className="video-progress-fill" style={{ width: `${progress}%` }} />
            <div className="video-progress-thumb" style={{ left: `${progress}%` }} />
          </div>
        </div>

        {/* Tap for sound — top right, subtle */}
        {!activated && (
          <div className="tap-for-sound" onClick={(e) => e.stopPropagation()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            <span>Tap for sound</span>
          </div>
        )}
      </div>
    </div>
  );
}
