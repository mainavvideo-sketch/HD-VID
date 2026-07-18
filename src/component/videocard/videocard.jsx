import { useRef, useState, useEffect } from "react";
import play from "../../assets/playbutton.png";
import { Link } from "react-router-dom";

function VideoCard({ video, onPlay, onEnd })  {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const instanceId = useRef(`${Date.now()}-${Math.random()}`);

  const handlePlay = (e) => {
  e.preventDefault();
  e.stopPropagation();

  setIsPlaying(true);

  onPlay?.(); // Pause slider

  if (videoRef.current) {
    videoRef.current.play();
  }

  window.dispatchEvent(
    new CustomEvent("video-play", {
      detail: instanceId.current,
    })
  );
};

  const handleEnded = () => {
  if (videoRef.current) {
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }

  setIsPlaying(false);

  onEnd?.(); // Resume slider
};

const onOtherPlay = (e) => {
  if (e.detail !== instanceId.current) {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    setIsPlaying(false);

    onEnd?.();
  }
};

  useEffect(() => {
    const onOtherPlay = (e) => {
      if (e.detail !== instanceId.current) {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsPlaying(false);
      }
    };

    window.addEventListener("video-play", onOtherPlay);

    return () => {
      window.removeEventListener("video-play", onOtherPlay);
    };
  }, []);

  return (
    <div className="video-card">
      <div className="video-overlay">

        {!isPlaying && (
          <>
            <Link to={`/watch/${video.id}`}>
              <img
                src={video.thumbnail_s}
                className="thumbnail"
                alt={video.title}
              />
            </Link>

            <div className="play-icon" onClick={handlePlay}>
              <img src={play} alt="Play" />
            </div>
          </>
        )}

        {isPlaying && (
          <video
            ref={videoRef}
            src={video.trailer}
            poster={video.thumbnail_s}
            className="trailer"
            preload="metadata"
            autoPlay
            muted
            playsInline
            onEnded={handleEnded}
          />
        )}
      </div>

      <div className="meta">
        <Link to={`/watch/${video.id}`}>
          <h1 className="video-title">{video.title}</h1>
        </Link>

        <div className="actress">
          {video.actress.map((name, index) => (
            <span key={index}>
              <Link to={`/actress/${encodeURIComponent(name)}`}>
                {name}
              </Link>
            </span>
          ))}
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
  );
}

export default VideoCard;