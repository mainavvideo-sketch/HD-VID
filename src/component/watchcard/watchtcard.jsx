import { useState, useRef } from "react";
import "@videojs/react/video/minimal-skin.css";
import { createPlayer, videoFeatures } from "@videojs/react";
import { MinimalVideoSkin, Video } from "@videojs/react/video";
import "./watchcard.css";
import watchplay from "../../assets/playbutton.png";

const Player = createPlayer({
  features: videoFeatures,
});

function WatchCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlay = () => {
    setIsPlaying(true);
    videoRef.current?.play?.();
  };

  return (
    <div className="watch-card">
      {!isPlaying && (
        <>
          <img
            src={video.thumbnail}
            className="watch-thumnail"
            alt="Video thumbnail"
          />
          <div className="watchplay" onClick={handlePlay}>
            <img src={watchplay} alt="Play button" />
          </div>
        </>
      )}
      <Player.Provider>
        <MinimalVideoSkin>
          <Video
            ref={videoRef}
            src={video.src}
            poster={video.thumbnail}
            playsInline
            autoPlay={isPlaying}
            disableRemotePlayback
          />
        </MinimalVideoSkin>
      </Player.Provider>
    </div>
  );
}

export default WatchCard;
