import { useEffect, useState } from "react";
import "./home.css";
import VideoCard from "../component/videocard/videocard";
import Pagination from "../component/pagination/pagination";
import loading2 from "../assets/loading2.gif";
import Trending from "../component/trending/trending";
import { useSearchParams } from "react-router-dom";
const videosPerPage = 20;

function Home() {
  const [videos, setVideos] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data);
      });
  }, []);

  if (videos.length === 0) {
    return (
      <div className="watch-main">
        <div className="loading-page">
          <img className="loading2" src={loading2} alt="Loading" />
        </div>
      </div>
    );
  }

  const lastIndex = currentPage * videosPerPage;
  const firstIndex = lastIndex - videosPerPage;

  const currentVideos = videos.slice(firstIndex, lastIndex);

  const totalPages = Math.ceil(videos.length / videosPerPage);

  return (
    <div className="main">
      <Trending videos={videos} />
      <div className="content">
        <div className="category-header">
          <h2 className="category-title">Latest Videos</h2>
          <span className="category-count">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </span>
        </div>
        {/* key on currentPage restarts the stagger-in animation on every page change */}
        <div className="video-list" key={currentPage}>
          {currentVideos.map((video, index) => (
            <VideoCard key={video.id} video={video} index={index} />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setSearchParams({ page: page.toString() });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
}

export default Home;
