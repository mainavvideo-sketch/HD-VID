import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import loading2 from "../assets/loading2.gif";
import Pagination from "../component/pagination/pagination";

const videosPerPage = 20;

function ActressPage() {
  const { name } = useParams();
  const [videos, setVideos] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const actressName = decodeURIComponent(name);

        // filter by actress then sort by date (newest first)
        const filtered = data
          .filter((video) => video.actress.includes(actressName))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setVideos(filtered);
      });
  }, [name]);

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
        <h2 className="video-count">
          "{decodeURIComponent(name)}" ({videos.length})
        </h2>
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

export default ActressPage;
