import { useEffect, useRef, useState } from "react";
import TrendingCard from "../trendingcard/trendingcard";
import "./trending.css";

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes, tied to real wall-clock time

// Must match --card-gap in trending.css. Kept as one constant so the JS
// layout math (flex-basis / translateX) and the CSS gap never drift apart.
const CARD_GAP_PX = 6;

// Cards-per-view breakpoints. Mobile and tablet show one full-width card
// with no peek of the next one; desktop shows a multi-card carousel.
const BREAKPOINTS = [
  { maxWidth: 640, cards: 1 },
  { maxWidth: 1024, cards: 1 },
  { maxWidth: Infinity, cards: 3 },
];

function getCardsForWidth(width) {
  const match = BREAKPOINTS.find((bp) => width <= bp.maxWidth);
  return match ? match.cards : 3;
}

// --- Deterministic, storage-free scheduling -------------------------------
// Instead of persisting state (which only survives on one browser/device),
// we derive everything from the current wall-clock time. Every device's
// clock agrees on which 5-minute "window" we're in, so every device
// independently computes the exact same video selection and the exact same
// countdown — no localStorage, no server, no reset on reload/device change.

const getWindowIndex = (t) => Math.floor(t / REFRESH_MS);

// Small deterministic string hash -> 32-bit int, used as a PRNG seed.
function hashToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Deterministic PRNG (mulberry32) — same seed always yields the same
// sequence, on any device/browser.
function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(array, seed) {
  const rng = mulberry32(seed);
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Picks the 10 videos for a given window, deterministically, while
// avoiding a repeat of whatever the previous window picked.
function getVideosForWindow(videos, windowIndex) {
  if (!videos.length) return [];

  const prevSeed = hashToSeed(`trending-window-${windowIndex - 1}`);
  const prevPicks = seededShuffle(videos, prevSeed).slice(
    0,
    Math.min(10, videos.length)
  );
  const prevIds = new Set(prevPicks.map((v) => v.id));

  let available = videos.filter((v) => !prevIds.has(v.id));
  if (available.length < 10) available = videos;

  const seed = hashToSeed(`trending-window-${windowIndex}`);
  return seededShuffle(available, seed).slice(0, Math.min(10, available.length));
}
// ---------------------------------------------------------------------------

function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function Trending({ videos = [], loading = false }) {
  const [current, setCurrent] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time, reload-proof refresh clock
  const [nextRefreshAt, setNextRefreshAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Drag / swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const wasDraggedRef = useRef(false);

  const sliderRef = useRef(null);

  // Track which 5-minute window is currently loaded, so we only recompute
  // when the window actually changes.
  const loadedWindowRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  const maxIndex = Math.max(
    Math.ceil(trendingVideos.length - visibleCards),
    0
  );

  // Load whichever batch of videos belongs to the current wall-clock window.
  // Because this is purely a function of time + the video list, every
  // device/browser lands on the exact same videos and the exact same
  // refresh boundary — nothing to persist, nothing to reset.
  const syncToCurrentWindow = () => {
    if (!videos.length) return;

    const windowIndex = getWindowIndex(Date.now());
    if (loadedWindowRef.current === windowIndex) return;

    const applyUpdate = () => {
      loadedWindowRef.current = windowIndex;
      setTrendingVideos(getVideosForWindow(videos, windowIndex));
      setCurrent(0);
      setNextRefreshAt((windowIndex + 1) * REFRESH_MS);

      if (!isFirstLoadRef.current) {
        setAnnouncement("Trending videos updated");
      }
      isFirstLoadRef.current = false;
      setIsRefreshing(false);
    };

    if (isFirstLoadRef.current) {
      applyUpdate();
    } else {
      // Fade the current cards out, swap the data underneath, then fade in.
      setIsRefreshing(true);
      window.setTimeout(applyUpdate, 260);
    }
  };

  // Responsive cards-per-view, with a fractional "peek" on small screens
  useEffect(() => {
    const handleResize = () => {
      setVisibleCards(getCardsForWidth(window.innerWidth));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initial load — and any time the incoming `videos` list changes — snap
  // to whichever 5-minute window we're currently in. No reload, browser
  // switch, or device switch changes the outcome, since it's derived
  // entirely from the current time.
  useEffect(() => {
    loadedWindowRef.current = null; // force a recompute if `videos` changed
    syncToCurrentWindow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  // Real-time clock tick — drives the countdown display and fires the
  // 5-minute refresh based on actual elapsed wall-clock time.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (nextRefreshAt && now >= nextRefreshAt) {
      syncToCurrentWindow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, nextRefreshAt]);

  // Auto slider — purely cosmetic scrolling, decoupled from the 5-minute
  // content refresh; it just loops back to the start when it reaches the end.
  useEffect(() => {
    if (
      trendingVideos.length <= visibleCards ||
      isHovered ||
      isDragging ||
      isFocused
    )
      return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [visibleCards, trendingVideos.length, isHovered, isDragging, isFocused, maxIndex]);

  const goPrev = () => {
    setHasInteracted(true);
    setCurrent((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goNext = () => {
    setHasInteracted(true);
    setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Keyboard navigation (desktop) — arrows step, Home/End jump to ends
  const onSliderKeyDown = (e) => {
    if (maxIndex <= 0) return;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        goPrev();
        break;
      case "ArrowRight":
        e.preventDefault();
        goNext();
        break;
      case "Home":
        e.preventDefault();
        setHasInteracted(true);
        setCurrent(0);
        break;
      case "End":
        e.preventDefault();
        setHasInteracted(true);
        setCurrent(maxIndex);
        break;
      default:
        break;
    }
  };

  const onSliderFocus = () => setIsFocused(true);
  const onSliderBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false);
  };

  // --- Drag (thumb / mouse) handlers ---
  const dragThreshold = () => {
    const width = sliderRef.current?.offsetWidth || 300;
    return (width / visibleCards) * 0.2;
  };

  const handleDragStart = (clientX) => {
    if (trendingVideos.length <= visibleCards) return;
    setIsDragging(true);
    setIsHovered(true);
    setHasInteracted(true);
    wasDraggedRef.current = false;
    dragStartX.current = clientX;
    dragCurrentX.current = clientX;
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    dragCurrentX.current = clientX;
    const delta = clientX - dragStartX.current;
    if (Math.abs(delta) > 3) wasDraggedRef.current = true;
    setDragOffset(delta);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    const delta = dragCurrentX.current - dragStartX.current;
    const threshold = dragThreshold();

    if (delta > threshold) {
      goPrev();
    } else if (delta < -threshold) {
      goNext();
    }

    setIsDragging(false);
    setDragOffset(0);
    setIsHovered(false);
  };

  // Touch (thumb) handlers
  const onTouchStart = (e) => handleDragStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleDragMove(e.touches[0].clientX);
  const onTouchEnd = () => handleDragEnd();

  // Mouse (click-drag) handlers
  const onMouseDown = (e) => handleDragStart(e.clientX);
  const onMouseLeave = () => {
    if (!isDragging) setIsHovered(false);
  };
  const onMouseEnter = () => setIsHovered(true);

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e) => handleDragMove(e.clientX);
    const handleWindowMouseUp = () => handleDragEnd();

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  const onTrackClickCapture = (e) => {
    if (wasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      wasDraggedRef.current = false;
    }
  };

  // ---- Loading skeleton state ----
  if (loading) {
    const skeletonCount = Math.max(Math.ceil(visibleCards), 3);
    return (
      <div className="trending">
        <div className="trending-header">
          <h2 className="trending-videos">
            <span className="flame">🔥</span> Trending Videos
          </h2>
        </div>
        <div className="trending-skeleton-row" aria-hidden="true">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div className="trending-skeleton-card" key={i}>
              <div className="trending-skeleton-thumb" />
              <div className="trending-skeleton-line trending-skeleton-line--wide" />
              <div className="trending-skeleton-line trending-skeleton-line--narrow" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Empty state ----
  if (!trendingVideos.length) {
    return (
      <div className="trending">
        <div className="trending-header">
          <h2 className="trending-videos">
            <span className="flame">🔥</span> Trending Videos
          </h2>
        </div>
        <div className="trending-empty">
          <span className="trending-empty-icon" aria-hidden="true">
            📭
          </span>
          <p>No trending videos right now — check back soon.</p>
        </div>
      </div>
    );
  }

  // Build the transform expression — works for fractional visibleCards too,
  // so the mobile/tablet "peek" and the desktop multi-card view share one
  // formula.
  const translateExpr = `-${current} * ((100% - ${
    (visibleCards - 1) * CARD_GAP_PX
  }px) / ${visibleCards} + ${CARD_GAP_PX}px)`;

  const trackTransform = isDragging
    ? `translateX(calc(${translateExpr} + ${dragOffset}px))`
    : `translateX(calc(${translateExpr}))`;

  const canNavigate = trendingVideos.length > visibleCards;

  const msLeft = nextRefreshAt ? Math.max(0, nextRefreshAt - now) : REFRESH_MS;
  const countdownLabel = formatCountdown(msLeft);
  const refreshProgress = 1 - msLeft / REFRESH_MS;

  const goToIndex = (index) => {
    setHasInteracted(true);
    setCurrent(Math.min(Math.max(index, 0), maxIndex));
  };

  return (
    <div className="trending">
      <div className="trending-header">
        <h2 className="trending-videos">
          <span className="flame">🔥</span> Trending Videos
        </h2>
        <span
          className={`trending-live${msLeft <= 10000 ? " trending-live--urgent" : ""}`}
          title="New videos load automatically every 5 minutes"
          style={{ "--refresh-progress": refreshProgress }}
        >
          Refresh in {countdownLabel}
        </span>
      </div>

      <span className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </span>

      <div className="trending-body">
        {canNavigate && (
          <button
            type="button"
            className="trending-arrow trending-arrow--prev"
            onClick={goPrev}
            aria-label="Previous videos"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div
          className="trending-slider"
          ref={sliderRef}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onFocus={onSliderFocus}
          onBlur={onSliderBlur}
          onKeyDown={onSliderKeyDown}
          tabIndex={canNavigate ? 0 : -1}
          role="region"
          aria-roledescription="carousel"
          aria-label="Trending videos"
        >
          {canNavigate && (
            <span
              className={`trending-swipe-hint${hasInteracted ? " trending-swipe-hint--hidden" : ""}`}
              aria-hidden="true"
            >
              <span>‹</span> swipe <span>›</span>
            </span>
          )}

          <div
            className={`trending-track${isDragging ? " dragging" : ""}${
              isRefreshing ? " refreshing" : ""
            }`}
            style={{ transform: trackTransform }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onClickCapture={onTrackClickCapture}
          >
            {trendingVideos.map((video, index) => {
              const rank = index + 1;
              return (
                <div
                  key={video.id}
                  className="trending-card"
                  style={{
                    flex: `0 0 calc((100% - ${
                      (visibleCards - 1) * CARD_GAP_PX
                    }px) / ${visibleCards})`,
                    maxWidth: `calc((100% - ${
                      (visibleCards - 1) * CARD_GAP_PX
                    }px) / ${visibleCards})`,
                  }}
                >
                  <TrendingCard video={video} rank={rank} />
                </div>
              );
            })}
          </div>
        </div>

        {canNavigate && (
          <button
            type="button"
            className="trending-arrow trending-arrow--next"
            onClick={goNext}
            aria-label="Next videos"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {canNavigate && (
        <div className="trending-dots" role="tablist" aria-label="Slide navigation">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={`trending-dot${index === current ? " active" : ""}`}
              role="tab"
              aria-selected={index === current}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
