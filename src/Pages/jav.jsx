import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import Pagination from "../component/pagination/pagination";
import loading2 from "../assets/loading2.gif";
import "./china.css";

const videosPerPage = 20;

function JavPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);

    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const filteredVideos = data.filter(
          (video) => video.category === "Jav",
        );
        const sortedVideos = [...filteredVideos].sort(
          (a, b) =>
            new Date(b.date || b.publishedAt) -
            new Date(a.date || a.publishedAt),
        );
        setVideos(sortedVideos);
        setLoading(false);
      });
  }, []);

  if (loading) {
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
      <div className="content">
        <div className="category-header">
          <h2 className="category-title">jav</h2>
          <span className="category-count">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="category-empty">
            <p>No videos in this category yet.</p>
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

export default JavPage;