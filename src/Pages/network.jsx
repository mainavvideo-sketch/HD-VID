import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import Pagination from "../component/pagination/pagination";
import loading2 from "../assets/loading2.gif";
import "./network.css";

const videosPerPage = 20;

function NetworkPage() {
  const { name } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const networkName = decodeURIComponent(name);

  useEffect(() => {
    setLoading(true);

    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = data
          .filter((video) => video.network === networkName)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setVideos(filtered);
        setLoading(false);
      });
  }, [name]);

  const lastIndex = currentPage * videosPerPage;
  const firstIndex = lastIndex - videosPerPage;
  const currentVideos = videos.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  const initial = networkName.charAt(0).toUpperCase();

  if (loading) {
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
        <div className="network-header">
          <div className="network-badge">{initial}</div>
          <div className="network-header-text">
            <span className="network-label">Network</span>
            <h2 className="network-name">{networkName}</h2>
            <span className="network-count">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </span>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="network-empty">
            <p>No videos found for "{networkName}" yet.</p>
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

export default NetworkPage;