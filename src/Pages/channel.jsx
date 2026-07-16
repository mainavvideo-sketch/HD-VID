import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import Pagination from "../component/pagination/pagination";
import loading2 from "../assets/loading2.gif";

const videosPerPage = 20;

function ChannelPage() {
  const { name } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);

    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const channel = decodeURIComponent(name);

        const filteredVideos = data.filter(
          (video) => video.channel === channel
        );

        setVideos(filteredVideos);
        setLoading(false);
      });
  }, [name]);

  const lastIndex = currentPage * videosPerPage;
  const firstIndex = lastIndex - videosPerPage;
  const currentVideos = videos.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(videos.length / videosPerPage);

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
        <h2 className="video-count">
          "{decodeURIComponent(name)}" ({videos.length})
        </h2>

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
      </div>
    </div>
  );
}

export default ChannelPage;