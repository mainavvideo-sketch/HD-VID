import { useRef, useState, useEffect } from "react";
import "./videocard.css";
import play from "../../assets/playbutton.png";
import { Link } from "react-router-dom";
import React from "react";

const PLAY_BURST_MS = 300;

// Backend proxy URL (set VITE_API_URL in .env)
const API = import.meta.env?.VITE_API_URL || "http://localhost:3000";
const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// Set to false to play the trailer URL directly (no proxy)
const USE_PROXY = true;

function VideoCard({ video, index = 0 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef(null);
  const instanceId = useRef(`${Date.now()}-${Math.random()}`);
  const reducedMotionRef = useRef(false);
  const burstTimerRef = useRef(null);

  // Trailer source: proxied via backend (UUID taken from video.trailer)
  const trailerId = video.trailer?.match(UUID_RE)?.[0];
  const trailerSrc = video.trailer
    ? USE_PROXY && trailerId
      ? `${API}/video/${trailerId}`
      : video.trailer
    : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  // Stop this card when another card starts playing
  useEffect(() => {
    const onOtherPlay = (e) => {
      if (e?.detail !== instanceId.current) {
        setIsPlaying(false);
        setIsExiting(false);
      }
    };
    window.addEventListener("video-play", onOtherPlay);
    return () => {
      window.removeEventListener("video-play", onOtherPlay);
      clearTimeout(burstTimerRef.current);
    };
  }, []);

  const startPlaying = () => {
    setIsPlaying(true);
    window.dispatchEvent(
      new CustomEvent("video-play", { detail: instanceId.current }),
    );
    // video element mounts on next render, then we ask it to play
    setTimeout(() => {
      videoRef.current?.play?.().catch(() => {});
    }, 100);
  };

  const handlePlayPress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExiting || !trailerSrc) return;

    if (reducedMotionRef.current) {
      startPlaying();
      return;
    }

    setIsExiting(true);
    // Fallback in case animationend doesn't fire
    burstTimerRef.current = setTimeout(() => {
      setIsExiting(false);
      startPlaying();
    }, PLAY_BURST_MS + 150);
  };

  const handleBurstAnimationEnd = (e) => {
    // animation name must match the keyframes name in videocard.css
    if (e.target !== e.currentTarget || e.animationName !== "playBurst") return;
    clearTimeout(burstTimerRef.current);
    setIsExiting(false);
    startPlaying();
  };

  const handlePlayKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") handlePlayPress(e);
  };

  // Trailer finished -> back to the thumbnail
  const handleEnded = () => setIsPlaying(false);

  return (
    <div className="video-card" style={{ "--i": index % 20 }}>
      <div className="video-overlay">
        {!isLoaded && <div className="loading-icon" aria-hidden="true" />}

        {!isPlaying ? (
          <>
            <Link to={`/watch/${video.id}`} className="media-link">
              {video.thumbnail_s && (
                <img
                  src={video.thumbnail_s}
                  className={`thumbnail${isLoaded ? " is-loaded" : ""}`}
                  alt={video.title}
                  loading="lazy"
                  onLoad={() => setIsLoaded(true)}
                  onError={() => setIsLoaded(true)}
                />
              )}
            </Link>

            {isLoaded && trailerSrc && (
              <div
                className={`play-icon${isExiting ? " is-exiting" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Play trailer: ${video.title}`}
                onClick={handlePlayPress}
                onKeyDown={handlePlayKeyDown}
                onAnimationEnd={handleBurstAnimationEnd}
              >
                <img src={play} alt="" aria-hidden="true" />
              </div>
            )}
          </>
        ) : (
          // Outside <Link> so clicking the controls doesn't navigate
          <div className="card-player-wrap">
            <video
              ref={videoRef}
              src={trailerSrc}
              poster={video.thumbnail_s || undefined}
              className="card-player"
              preload="metadata"
              playsInline
              autoPlay
              disableRemotePlayback
              onEnded={handleEnded}
            />
          </div>
        )}
      </div>

      <div className="meta">
        <Link to={`/watch/${video.id}`}>
          <h1 className="video-title">{video.title}</h1>
        </Link>
        <div className="meta-info">
          <div className="actress">
            <span>
              {video.actress.map((name, i) => (
                <React.Fragment key={i}>
                  <Link to={`/actress/${encodeURIComponent(name)}`}>
                    {name}
                  </Link>
                  {i < video.actress.length - 1 && ", "}
                </React.Fragment>
              ))}
            </span>
          </div>
          <div className="network">
            <span>
              <Link
                to={
                  video.channel
                    ? `/channel/${encodeURIComponent(video.channel)}`
                    : `/network/${encodeURIComponent(video.network)}`
                }
              >
                {video.channel || video.network}
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;