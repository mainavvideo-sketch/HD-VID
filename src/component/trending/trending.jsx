import { useEffect, useState } from "react";
import VideoCard from "../videocard/videocard";
import "./trending.css";

export default function Trending({ videos = [] }) {
  const [current, setCurrent] = useState(0);
  const [visibleCards, setVisibleCards] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);

  const trendingVideos = videos.slice(0, 10);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setVisibleCards(1);
      } else if (window.innerWidth <= 992) {
        setVisibleCards(3);
      } else {
        setVisibleCards(5);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Stop slider while video is playing
  useEffect(() => {
    if (isPlaying) return;
    if (trendingVideos.length <= visibleCards) return;

    const interval = setInterval(() => {
      setCurrent((prev) =>
        prev >= trendingVideos.length - visibleCards ? 0 : prev + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [current, visibleCards, trendingVideos.length, isPlaying]);

  if (!trendingVideos.length) return null;

  return (
    <div className="trending">
      <h4 className="video-count">🔥 Trending Videos</h4>

      <div className="trending-slider">
        <div
          className="trending-track"
          style={{
            transform: `translateX(-${current * (100 / visibleCards)}%)`,
          }}
        >
          {trendingVideos.map((video) => (
            <div
              key={video.id}
              className="trending-card"
              style={{
                flex: `0 0 ${100 / visibleCards}%`,
                maxWidth: `${100 / visibleCards}%`,
              }}
            >
              <VideoCard
                video={video}
                onPlay={() => setIsPlaying(true)}
                onEnd={() => setIsPlaying(false)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}