import { useState, useRef, useEffect } from "react";
import "@videojs/react/video/minimal-skin.css";
import { createPlayer, videoFeatures } from "@videojs/react";
import { MinimalVideoSkin, Video } from "@videojs/react/video";
import "./watchcard.css";
import watchplay from "../../assets/playbutton.png";

const Player = createPlayer({
  features: videoFeatures,
});

const PLAY_BURST_MS = 300;

function WatchCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const burstTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    return () => clearTimeout(burstTimerRef.current);
  }, []);

  const startPlaying = () => {
    setIsPlaying(true);

    setTimeout(() => {
      videoRef.current?.play?.();
    }, 100);
  };

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExiting) return; // ignore repeat presses mid-animation

    if (reducedMotionRef.current) {
      startPlaying();
      return;
    }

    setIsExiting(true);
    // Fallback in case animationend doesn't fire (older/odd browsers) —
    // give it a little extra headroom over the animation's own duration.
    burstTimerRef.current = setTimeout(() => {
      setIsExiting(false);
      startPlaying();
    }, PLAY_BURST_MS + 150);
  };

  const handleBurstAnimationEnd = (e) => {
    if (e.target !== e.currentTarget || e.animationName !== "watchPlayBurst") {
      return;
    }
    clearTimeout(burstTimerRef.current);
    setIsExiting(false);
    startPlaying();
  };

  const handlePlayKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handlePlay(e);
    }
  };

  return (
    <div className="watch-card">

      {!isPlaying ? (
        <div className="thumb-wrap">
          <img
            src={video.thumbnail}
            className="watch-thumnail"
            alt="Video thumbnail"
          />

          <div
            className={`watchplay${isExiting ? " is-exiting" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="Play video"
            onClick={handlePlay}
            onKeyDown={handlePlayKeyDown}
            onAnimationEnd={handleBurstAnimationEnd}
          >
            <img src={watchplay} alt="" aria-hidden="true" />
          </div>
        </div>
      ) : (
        <div className="player-wrap">
          <Player.Provider>
            <MinimalVideoSkin>
              <Video
                ref={videoRef}
                src={video.src}
                preload="metadata"
                playsInline
                autoPlay
                disableRemotePlayback
              >
                <track 
                kind="metadata"
                label="thumbnails"
                src={video.vtt}
                default
                />
              </Video>
            </MinimalVideoSkin>
          </Player.Provider>
        </div>
      )}

    </div>
  );
}

export default WatchCard;