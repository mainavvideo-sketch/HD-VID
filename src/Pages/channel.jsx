import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import Pagination from "../component/pagination/pagination";
import loading2 from "../assets/loading2.gif";
import "./channel.css";

const videosPerPage = 20;

function ChannelPage() {
  const { name } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const channelName = decodeURIComponent(name);

  useEffect(() => {
    setLoading(true);

    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const filteredVideos = data
          .filter((video) => video.channel === channelName)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setVideos(filteredVideos);
        setLoading(false);
      });
  }, [name]);

  const lastIndex = currentPage * videosPerPage;
  const firstIndex = lastIndex - videosPerPage;
  const currentVideos = videos.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(videos.length / videosPerPage);

  const initial = channelName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="watch-main">
        <div className="loading-page">
          <img className="loading2" src={loading2} alt="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="content">
        <div className="channel-header">
          <div className="channel-badge">{initial}</div>
          <div className="channel-header-text">
            <span className="channel-label">Channel</span>
            <h2 className="channel-name">{channelName}</h2>
            <span className="channel-count">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </span>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="channel-empty">
            <p>No videos found for "{channelName}" yet.</p>
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

export default ChannelPage;