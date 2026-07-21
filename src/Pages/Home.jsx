import { useEffect, useState } from "react";
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
          <img className="loading2" src={loading2} />
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
        <h2 className="video-count">Latest Videos ({videos.length})</h2>
        <div className="video-list">
          {currentVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setSearchParams({ page: page.toString() })}
        />
      </div>
    </div>
  );
}

export default Home;
