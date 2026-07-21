import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import loading2 from "../assets/loading2.gif";
import Pagination from "../component/pagination/pagination";
import "./actress.css";

const videosPerPage = 20;

function ActressPage() {
  const { name } = useParams();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const actressName = decodeURIComponent(name);

  useEffect(() => {
    setIsLoading(true);

    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data
          .filter((video) => video.actress.includes(actressName))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setVideos(filtered);
        setIsLoading(false);
      });
  }, [name]);

  const lastIndex = currentPage * videosPerPage;
  const firstIndex = lastIndex - videosPerPage;
  const currentVideos = videos.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  const initials = actressName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (isLoading) {
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
        <div className="actress-header">
          <div className="actress-avatar">{initials}</div>
          <div className="actress-header-text">
            <h2 className="actress-name">{actressName}</h2>
            <span className="actress-count">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </span>
          </div>
        </div>

        {videos.length === 0 ? (
  <div className="actress-empty">
    <p>No videos found for "{actressName}" yet.</p>
  </div>
) : (
  <>
    <div className="video-list">
      {currentVideos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>

    {totalPages > 1 && (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) =>
          setSearchParams({ page: page.toString() })
        }
      />
    )}
  </>
)}
      </div>
    </div>
  );
}

export default ActressPage;