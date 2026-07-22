import { useEffect, useRef, useState } from "react";
import TrendingCard from "../trendingcard/trendingcard";
import "./trending.css";

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes, tied to real wall-clock time
const STORAGE_KEY = "trending_carousel_state_v1";

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode / quota) — fail silently,
    // refresh timing just won't survive a reload this session.
  }
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function Trending({ videos = [] }) {
  const [current, setCurrent] = useState(0);
  const [visibleCards, setVisibleCards] = useState(5);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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
  const wheelLockRef = useRef(false);

  // Store recently used videos with timestamp (avoid repeats within one refresh window)
  const recentVideosRef = useRef([]);

  const maxIndex = Math.max(trendingVideos.length - visibleCards, 0);

  // Pick a fresh batch of videos, persist the selection + next refresh time
  const pickRandomVideos = () => {
    if (!videos.length) return;

    const pickTime = Date.now();

    recentVideosRef.current = recentVideosRef.current.filter(
      (item) => pickTime - item.time < REFRESH_MS
    );

    const recentIds = recentVideosRef.current.map((item) => item.id);
    let available = videos.filter((video) => !recentIds.includes(video.id));
    if (available.length < 10) available = [...videos];

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setTrendingVideos(selected);
    setCurrent(0);

    recentVideosRef.current.push(
      ...selected.map((video) => ({ id: video.id, time: pickTime }))
    );

    const refreshAt = pickTime + REFRESH_MS;
    setNextRefreshAt(refreshAt);

    saveStoredState({
      videoIds: selected.map((v) => v.id),
      refreshAt,
      recentIds: recentVideosRef.current,
    });
  };

  // Responsive cards
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setVisibleCards(1);
      } else if (window.innerWidth <= 768) {
        setVisibleCards(2);
      } else if (window.innerWidth <= 1024) {
        setVisibleCards(3);
      } else {
        setVisibleCards(5);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initial load — restore an in-progress refresh window from storage so a
  // page reload doesn't reset the 5-minute clock or reshuffle the videos.
  useEffect(() => {
    if (!videos.length) return;

    const stored = loadStoredState();
    const loadTime = Date.now();

    if (stored?.refreshAt && loadTime < stored.refreshAt && Array.isArray(stored.videoIds)) {
      const restored = stored.videoIds
        .map((id) => videos.find((v) => v.id === id))
        .filter(Boolean);

      if (restored.length) {
        recentVideosRef.current = (stored.recentIds || []).filter(
          (item) => loadTime - item.time < REFRESH_MS
        );
        setTrendingVideos(restored);
        setCurrent(0);
        setNextRefreshAt(stored.refreshAt);
        return;
      }
    }

    recentVideosRef.current = (stored?.recentIds || []).filter(
      (item) => loadTime - item.time < REFRESH_MS
    );
    pickRandomVideos();
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
      pickRandomVideos();
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
      setCurrent((prev) => {
        const atEnd = prev >= trendingVideos.length - visibleCards;
        return atEnd ? 0 : prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [visibleCards, trendingVideos.length, isHovered, isDragging, isFocused]);

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

  // Mouse wheel handler
  useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;

    const handleWheel = (e) => {
      if (trendingVideos.length <= visibleCards) return;

      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

      if (Math.abs(delta) < 10) return;

      e.preventDefault();

      if (wheelLockRef.current) return;
      wheelLockRef.current = true;

      if (delta > 0) {
        goNext();
      } else {
        goPrev();
      }

      setTimeout(() => {
        wheelLockRef.current = false;
      }, 400);
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendingVideos.length, visibleCards, maxIndex]);

  if (!trendingVideos.length) return null;

  // Build the transform expression
  const translateExpr =
    visibleCards === 1
      ? `-${current * 100}%`
      : `-${current} * ((100% - ${(visibleCards - 1) * 5}px) / ${visibleCards} + 5px)`;

  const trackTransform = isDragging
    ? `translateX(calc(${translateExpr} + ${dragOffset}px))`
    : `translateX(calc(${translateExpr}))`;

  const canNavigate = trendingVideos.length > visibleCards;

  const msLeft = nextRefreshAt ? Math.max(0, nextRefreshAt - now) : REFRESH_MS;
  const countdownLabel = formatCountdown(msLeft);

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
          className="trending-live"
          title="New videos load automatically every 5 minutes"
        >
          Refresh in {countdownLabel}
        </span>
      </div>

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
          {canNavigate && !hasInteracted && (
            <span className="trending-swipe-hint" aria-hidden="true">
              <span>‹</span> swipe <span>›</span>
            </span>
          )}

          <div
            className={`trending-track${isDragging ? " dragging" : ""}`}
            style={{ transform: trackTransform }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onClickCapture={onTrackClickCapture}
          >
            {trendingVideos.map((video, index) => (
              <div
                key={video.id}
                className="trending-card"
                style={{
                  flex:
                    visibleCards === 1
                      ? "0 0 100%"
                      : `0 0 calc((100% - ${
                          (visibleCards - 1) * 5
                        }px) / ${visibleCards})`,
                  maxWidth:
                    visibleCards === 1
                      ? "100%"
                      : `calc((100% - ${
                          (visibleCards - 1) * 5
                        }px) / ${visibleCards})`,
                }}
              >
                <TrendingCard video={video} rank={index + 1} />
              </div>
            ))}
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
