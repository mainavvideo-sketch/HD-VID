import { useEffect, useRef, useState } from "react";
import TrendingCard from "../trendingcard/trendingcard";
import "./trending.css";

export default function Trending({ videos = [] }) {
  const [current, setCurrent] = useState(0);
  const [visibleCards, setVisibleCards] = useState(5);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Drag / swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const wasDraggedRef = useRef(false);

  const sliderRef = useRef(null);
  const wheelLockRef = useRef(false);

  // Store recently used videos with timestamp
  const recentVideosRef = useRef([]);

  const maxIndex = Math.max(trendingVideos.length - visibleCards, 0);

  // Pick 10 random videos (don't repeat within 60 seconds)
  const pickRandomVideos = () => {
    if (!videos.length) return;

    const now = Date.now();

    // Remove videos older than 60 seconds
    recentVideosRef.current = recentVideosRef.current.filter(
      (item) => now - item.time < 60000
    );

    const recentIds = recentVideosRef.current.map((item) => item.id);

    // Videos that haven't been shown recently
    let available = videos.filter((video) => !recentIds.includes(video.id));

    // If not enough videos, allow all videos again
    if (available.length < 10) {
      available = [...videos];
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setTrendingVideos(selected);
    setCurrent(0);

    // Save selected videos with current timestamp
    recentVideosRef.current.push(
      ...selected.map((video) => ({
        id: video.id,
        time: now,
      }))
    );
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

  // Initial load
  useEffect(() => {
    recentVideosRef.current = [];
    pickRandomVideos();
  }, [videos]);

  // Auto slider — refreshes the video set only when it auto-scrolls
  // through the full list (not on manual prev/next/drag/wheel)
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
        if (atEnd) {
          // Reached the end via auto-scroll — pull a fresh set of videos
          pickRandomVideos();
          return prev;
        }
        return prev + 1;
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
  const onMouseMove = (e) => {
    if (isDragging) e.preventDefault();
    handleDragMove(e.clientX);
  };
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => {
    setIsHovered(false);
    if (isDragging) handleDragEnd();
  };
  const onMouseEnter = () => setIsHovered(true);

  // Prevent the click that follows a drag from bubbling into a card click
  const onTrackClickCapture = (e) => {
    if (wasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      wasDraggedRef.current = false;
    }
  };

  // Mouse wheel handler (native listener so preventDefault works reliably)
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

  return (
    <div className="trending">
      <div className="trending-header">
        <h2 className="trending-videos">
          <span className="flame">🔥</span> Trending Videos
        </h2>
        <span className="trending-live">Refreshing</span>
      </div>

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
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onClickCapture={onTrackClickCapture}
        >
          {trendingVideos.map((video) => (
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
              <TrendingCard video={video} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
