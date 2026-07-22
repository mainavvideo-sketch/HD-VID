import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import WatchCard from "../component/watchcard/watchtcard";
import "./watch.css";
import RecommendedVideos from "../component/recommended/recommended";
import WatchInfo from "../component/watchcard/watchinfo";
import loading2 from "../assets/loading2.gif"


function WatchPage() {
const { id } = useParams();
const [videos, setVideos] = useState([]);
const [video, setVideo] = useState(null);

useEffect(() => {
  fetch(`${import.meta.env.BASE_URL}data/videos.json`)
    .then((res) => res.json())
    .then((data) => {
      setVideos(data);

      const current = data.find(
        (item) => item.id === Number(id)
      );

      setVideo(current);
    });
}, [id]);

  if (!video) {
  return (
    <div className="watch-main">
      <div className="loading-page">
        <img className="loading2" src={loading2}/>
        <p className="loading-text">Loading video…</p>
      </div>
    </div>
  );
}
  return (
    <div className="watch-main">
      <div className="watch-content">
        <WatchCard key={video.id} video={video} />
      </div>

      <WatchInfo key={id} video={video}/>

      <RecommendedVideos videos={videos} currentVideo={video} />
    </div>
  );
}

export default WatchPage;
