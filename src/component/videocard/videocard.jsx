import { useRef, useState, useEffect } from "react";
import play from "../../assets/playbutton.png";
import { Link } from "react-router-dom";
import React from "react";
import loading2 from "../../assets/loading2.gif";

function VideoCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
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
          {!isLoaded && (
            <img className="loading-icon" src={loading2} alt="Loading" />
          )}

          {isLoaded && !isPlaying && (
            <div className="play-icon" onClick={handlePlay}>
              <img src={play} alt="Play Icon" />
            </div>
          )}

          {!isPlaying && (
            <Link to={`/watch/${video.id}`}>
              <img
                src={video.thumbnail_s}
                className="thumbnail"
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsLoaded(true)}
                style={{ display: isLoaded ? "block" : "none" }}
              />
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
              style={{ display: isLoaded ? "block" : "none" }}
            />
          </Link>
        </div>

        <div className="meta">
          <Link to={`/watch/${video.id}`}>
            <h1 className="video-title">{video.title}</h1>
          </Link>
          <div className="meta-info">
            <div className="actress">
              <span>
                {video.actress.map((name, index) => (
                  <React.Fragment key={index}>
                    <Link to={`/actress/${encodeURIComponent(name)}`}>
                      {name}
                    </Link>
                    {index < video.actress.length - 1 && ", "}
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
    </>
  );
}

export default VideoCard;