import '@videojs/react/video/minimal-skin.css';
import { createPlayer, videoFeatures } from "@videojs/react";
import { MinimalVideoSkin, Video } from "@videojs/react/video";

const Player = createPlayer({
  features: videoFeatures,
});

function MyPlayer({ src, poster }) {
  return (
    <Player.Provider>
      <MinimalVideoSkin>
        <Video
          src={src}
          poster={poster}
          playsInline
        />
      </MinimalVideoSkin>
    </Player.Provider>
  );
}

export default MyPlayer;