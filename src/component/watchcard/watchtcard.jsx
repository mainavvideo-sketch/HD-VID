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

// false = pehle aapka Video.js player (proxy se), na chale to zerostorage ka embed
// true  = hamesha zerostorage ka embed player
const USE_EMBED = false;

// Backend proxy ka URL. Online (production) me VITE_API_URL set na ho to
// proxy use nahi hota aur seedha embed player chalta hai.
const API =
  import.meta.env?.VITE_API_URL ||
  (import.meta.env?.DEV ? "http://localhost:3000" : "");

function WatchCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [ownPlayerFailed, setOwnPlayerFailed] = useState(false);
  const videoRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const burstTimerRef = useRef(null);

  // zerostorage UUID video.src se nikalte hain (embed/UUID ya files/UUID/stream).
  // NOTE: video.id (jaise 3) sirf aapke data ki ID hai, wo UUID nahi hai.
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const fileId = video.fileId || video.src?.match(UUID_RE)?.[0];

  if (!fileId) console.warn("WatchCard: video.src me UUID nahi mili", video);
  const proxiedSrc = `${API}/video/${fileId}`;
  const useEmbed = USE_EMBED || !API || ownPlayerFailed;

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
          {useEmbed ? (
            <iframe
              src={`https://zerostorage.net/embed/${fileId}`}
              title={video.title || "Video"}
              style={{ width: "100%", height: "100%", aspectRatio: "16 / 9", border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
          <Player.Provider>
            <MinimalVideoSkin>
              <Video
                ref={videoRef}
                src={proxiedSrc}
                preload="metadata"
                playsInline
                autoPlay
                disableRemotePlayback
                onError={() => setOwnPlayerFailed(true)}
              >
                {video.vtt && (
                  <track
                    kind="metadata"
                    label="thumbnails"
                    src={video.vtt}
                    default
                  />
                )}
              </Video>
            </MinimalVideoSkin>
          </Player.Provider>
            </>
          )}
        </div>
      )}

    </div>
  );
}

export default WatchCard;