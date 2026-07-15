import { useRef, useState, useEffect } from "react";
import play from "../../assets/playbutton.png";
import { Link } from "react-router-dom";

function VideoCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const instanceId = useRef(`${Date.now()}-${Math.random()}`);

  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
    // notify other instances to stop
    window.dispatchEvent(
      new CustomEvent("video-play", { detail: instanceId.current }),
    );
  };

  const handleEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    const onOtherPlay = (e) => {
      if (e?.detail !== instanceId.current) {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        setIsPlaying(false);
      }
    };

    window.addEventListener("video-play", onOtherPlay);
    return () => window.removeEventListener("video-play", onOtherPlay);
  }, []);

  return (
    <>
      <div className="video-card">
        <div className="video-overlay">
          {!isPlaying && (
            <div className="play-icon" onClick={handlePlay}>
              <img src={play} alt="Play Icon" />
            </div>
          )}
          {!isPlaying && (
            <Link to={`/watch/${video.id}`}>
              <img src={video.thumbnail_s} className="thumbnail" />
            </Link>
          )}
          <Link to={`/watch/${video.id}`}>
            <video
              ref={videoRef}
              src={video.trailer}
              poster={video.thumbnail_s}
              className="trailer"
              preload="metadata"
              muted
              onEnded={handleEnded}
            />
          </Link>
        </div>

        <div className="meta">
          <Link to={`/watch/${video.id}`}>
            <h1 className="video-title">{video.title}</h1>
          </Link>

          <div className="actress">
            {video.actress.map((name, index) => (
              <span key={index}>
                <Link to={`/actress/${encodeURIComponent(name)}`}>{name}</Link>
              </span>
            ))}
          </div>

          <div className="studio">
            <span>
              <Link to={`/studio/${encodeURIComponent(video.studio)}`}>
                {video.subStudio || video.studio}
              </Link>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default VideoCard;
