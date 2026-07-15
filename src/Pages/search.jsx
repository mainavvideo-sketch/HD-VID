import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import VideoCard from "../component/videocard/videocard";
import Pagination from "../component/pagination/pagination";
import loading2 from "../assets/loading2.gif"
import { useSearchParams } from "react-router-dom";
const videosPerPage = 20;

function SearchPage() {
  const { keyword } = useParams();

  const [videos, setVideos] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;

  useEffect(() => {
   fetch(`${import.meta.env.BASE_URL}videos.json`)
      .then((res) => res.json())
      .then((data) => {
        const search = decodeURIComponent(keyword).toLowerCase();

        const filtered = data.filter((video) => {
          return (
            video.title.toLowerCase().includes(search) ||
            video.studio.toLowerCase().includes(search) ||
            video.subStudio?.toLowerCase().includes(search) ||
            video.actress.some((a) => a.toLowerCase().includes(search)) ||
            video.tags?.some((tag) => tag.toLowerCase().includes(search))
          );
        });

        // sort filtered videos by date (newest first). assume video.date is a parseable date string
        filtered.sort((a, b) => {
          const da = a.date ? new Date(a.date) : new Date(0);
          const db = b.date ? new Date(b.date) : new Date(0);
          return db - da;
        });

        setVideos(filtered);
      });
  }, [keyword]);

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
    <>
      <div className="main">
        <div className="content">
          <h2 className="video-count">Search: {decodeURIComponent(keyword)} ({videos.length})</h2>
          <div className="video-list">
            {videos.length ? (
              videos.map((video) => <VideoCard key={video.id} video={video} />)
            ) : (
              <h3>No videos found.</h3>
            )}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setSearchParams({ page: page.toString() })}
          />
        </div>
      </div>
    </>
  );
}

export default SearchPage;
