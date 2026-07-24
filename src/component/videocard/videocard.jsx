import { useRef, useState, useEffect } from "react";
import "./videocard.css";
import play from "../../assets/playbutton.png";
import { Link } from "react-router-dom";
import React from "react";

const PLAY_BURST_MS = 300;

function VideoCard({ video, index = 0 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef(null);
  const instanceId = useRef(`${Date.now()}-${Math.random()}`);
  const lockedRef = useRef(false); // true once the user explicitly presses play
  const reducedMotionRef = useRef(false);
  const burstTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  const playTrailer = () => {
    setIsPlaying(true);
    // wait a frame so the element is visible before asking it to play
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {
        // autoplay can be rejected silently; the poster stays visible either way
      });
    });
  };

  const handlePlayPress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExiting) return; // ignore repeat presses mid-animation
    lockedRef.current = true;

    const start = () => {
      playTrailer();
      window.dispatchEvent(
        new CustomEvent("video-play", { detail: instanceId.current }),
      );
    };

    if (reducedMotionRef.current) {
      start();
      return;
    }

    setIsExiting(true);
    burstTimerRef.current = setTimeout(() => {
      setIsExiting(false);
      start();
    }, PLAY_BURST_MS);
  };

  const handlePlayKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handlePlayPress(e);
    }
  };

  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    lockedRef.current = false;
    setIsPlaying(false);
  };

  useEffect(() => {
    const onOtherPlay = (e) => {
      if (e?.detail !== instanceId.current) {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        lockedRef.current = false;
        setIsPlaying(false);
      }
    };

    window.addEventListener("video-play", onOtherPlay);
    return () => {
      window.removeEventListener("video-play", onOtherPlay);
      clearTimeout(burstTimerRef.current);
    };
  }, []);

  return (
    <div className="video-card" style={{ "--i": index % 20 }}>
      <div className="video-overlay">
        {!isLoaded && <div className="loading-icon" aria-hidden="true" />}

        <Link to={`/watch/${video.id}`} className="media-link">
          {video.thumbnail_s && (
            <img
              src={video.thumbnail_s}
              className={`thumbnail${isLoaded ? " is-loaded" : ""}${
                isPlaying ? " is-hidden" : ""
              }`}
              alt={video.title}
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
            />
          )}
          {video.trailer && (
            <video
              ref={videoRef}
              src={video.trailer}
              poster={video.thumbnail_s || undefined}
              className={`trailer${isPlaying ? " is-visible" : ""}`}
              preload="metadata"
              muted
              playsInline
              onEnded={handleEnded}
            />
          )}
        </Link>

        {isLoaded && !isPlaying && (
          <div
            className={`play-icon${isExiting ? " is-exiting" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`Play ${video.title}`}
            onClick={handlePlayPress}
            onKeyDown={handlePlayKeyDown}
          >
            <img src={play} alt="" aria-hidden="true" />
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
