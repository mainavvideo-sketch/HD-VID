import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChinaWatchCard from "../component/watchcard/chinawatchtcard";
import "./watch.css";
import RecommendedVideos from "../component/recommended/recommended";
import WatchInfo from "../component/watchcard/watchinfo";
import loading2 from "../assets/loading2.gif"


function ChinaWatchPage() {
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
      </div>
    </div>
  );
}
  return (
    <div className="watch-main">
      <div className="watch-content">
        <ChinaWatchCard key={video.id} video={video} />
      </div>

      <WatchInfo key={id} video={video}/>

      <RecommendedVideos videos={videos} currentVideo={video} />
    </div>
  );
}

export default ChinaWatchPage;
