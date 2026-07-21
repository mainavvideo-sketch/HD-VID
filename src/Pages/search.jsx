import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import Pagination from "../component/pagination/pagination";
import loading2 from "../assets/loading2.gif";
import { Search as SearchIcon } from "react-bootstrap-icons";
import "./search.css";

const videosPerPage = 20;

function SearchPage() {
  const { keyword } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const searchTerm = decodeURIComponent(keyword);

  useEffect(() => {
    setLoading(true);

    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const search = searchTerm.toLowerCase();

       const filtered = data.filter((video) => {
  return (
    video.title.toLowerCase().includes(search) ||
    video.studio?.toLowerCase().includes(search) ||
    video.subStudio?.toLowerCase().includes(search) ||
    video.actress.some((a) => a.toLowerCase().includes(search)) ||
    video.tags?.some((tag) => tag.toLowerCase().includes(search))
  );
});

        filtered.sort((a, b) => {
          const da = a.date ? new Date(a.date) : new Date(0);
          const db = b.date ? new Date(b.date) : new Date(0);
          return db - da;
        });

        setVideos(filtered);
        setLoading(false);
      });
  }, [keyword]);

  const lastIndex = currentPage * videosPerPage;
  const firstIndex = lastIndex - videosPerPage;
  const currentVideos = videos.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(videos.length / videosPerPage);

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
        <div className="search-result-header">
          <div className="search-result-badge">
            <SearchIcon />
          </div>
          <div className="search-result-header-text">
            <span className="search-result-label">Search results for</span>
            <h2 className="search-result-term">"{searchTerm}"</h2>
            <span className="search-result-count">
              {videos.length} {videos.length === 1 ? "result" : "results"}
            </span>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="search-result-empty">
            <p>No videos found for "{searchTerm}".</p>
            <span>Try a different title, actress, or studio name.</span>
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

export default SearchPage;