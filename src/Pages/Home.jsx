import { useEffect, useState } from "react";
import VideoCard from "../component/videocard/videocard";
import loading2 from "../assets/loading2.gif"
import Pagination from "../component/pagination/pagination";
import { useSearchParams } from "react-router-dom";
const videosPerPage = 20;

function Home() {
  const [videos, setVideos] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const sortedVideos = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date),
        );
        setVideos(sortedVideos);
      });
  }, []);

  const lastIndex = currentPage * videosPerPage;
  const firstIndex = lastIndex - videosPerPage;

  const currentVideos = videos.slice(firstIndex, lastIndex);

  const totalPages = Math.ceil(videos.length / videosPerPage);

  if (videos.length === 0) {
    return (
      <div className="watch-main">
        <div className="loading-page">
          <img className="loading2" src={loading2} />
        </div>
      </div>
    );
  }

  return (
    <div className="main">
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
