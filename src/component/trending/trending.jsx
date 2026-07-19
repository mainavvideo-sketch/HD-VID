import { useEffect, useRef, useState } from "react";
import TrendingCard from "../trendingcard/trendingcard";
import "./trending.css";

export default function Trending({ videos = [] }) {
  const [current, setCurrent] = useState(0);
  const [visibleCards, setVisibleCards] = useState(5);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  // Store recently used videos with timestamp
  const recentVideosRef = useRef([]);

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

  // Change videos every 15 seconds
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      pickRandomVideos();
    }, 15000);

    return () => clearInterval(interval);
  }, [videos, isHovered]);

  // Auto slider
  useEffect(() => {
    if (trendingVideos.length <= visibleCards || isHovered) return;

    const interval = setInterval(() => {
      setCurrent((prev) =>
        prev >= trendingVideos.length - visibleCards ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [visibleCards, trendingVideos.length, isHovered]);

  if (!trendingVideos.length) return null;

  return (
    <div className="trending">
      <h2 className="video-count">🔥 Trending Videos</h2>

      <div
        className="trending-slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="trending-track"
          style={{
            transform:
              visibleCards === 1
                ? `translateX(-${current * 100}%)`
                : `translateX(calc(-${current} * ((100% - ${
                    (visibleCards - 1) * 5
                  }px) / ${visibleCards} + 5px))`,
          }}
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