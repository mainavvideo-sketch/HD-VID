import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PersonCircle } from "react-bootstrap-icons";
import { CameraReelsFill } from "react-bootstrap-icons";
import { Search } from "react-bootstrap-icons";
import "./search.css";
function SearchForm() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [videoSuggestions, setVideoSuggestions] = useState([]);
  const [actressSuggestions, setActressSuggestions] = useState([]);
  const [studioSuggestions, setStudioSuggestions] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const clearSuggestions = () => {
    setSearch("");
    setVideoSuggestions([]);
    setActressSuggestions([]);
    setStudioSuggestions([]);
  };

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => setVideos(data));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setVideoSuggestions([]);
      setActressSuggestions([]);
      setStudioSuggestions([]);
      return;
    }

    const keyword = search.toLowerCase();

    // Videos
    const videosFound = videos.filter((video) =>
      video.title.toLowerCase().includes(keyword),
    );

    // Actresses (unique)
    const actresses = [
      ...new Set(videos.flatMap((video) => video.actress)),
    ].filter((name) => name.toLowerCase().includes(keyword));

    // Studios + SubStudios (unique)
    const studios = [
      ...new Set(videos.flatMap((video) => [video.studio, video.subStudio])),
    ]
      .filter(Boolean)
      .filter((name) => name.toLowerCase().includes(keyword));

    setVideoSuggestions(videosFound.slice(0, 5));
    setActressSuggestions(actresses.slice(0, 5));
    setStudioSuggestions(studios.slice(0, 5));
  }, [search, videos]);


  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target)
    ) {
      setVideoSuggestions([]);
      setActressSuggestions([]);
      setStudioSuggestions([]);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  useEffect(() => {
    clearSuggestions();
  }, [location.pathname]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    navigate(`/search/${encodeURIComponent(search)}`);
    clearSuggestions();
  };

  return (
    <div className="search-box" ref={searchRef}>
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="text"
          value={search}
          placeholder="Search Video..."
          autoComplete="off"
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="search-btn"><Search/></button>
      </form>

      {(videoSuggestions.length ||
  actressSuggestions.length ||
  studioSuggestions.length) > 0 && (
  <div className="suggestions">
        {videoSuggestions.length > 0 && (
          <>
            <h4>Videos</h4>

            {videoSuggestions.map((video) => (
              <div
                key={video.id}
                className="suggestion"
                onClick={() => {
                  navigate(`/watch/${video.id}`);
                  clearSuggestions();
                }}
              >
                <img src={video.thumbnail_s} />
                <h2 className="video-title-s">{video.title}</h2>
              </div>
            ))}
          </>
        )}

        {actressSuggestions.length > 0 && (
          <>
            <h4>Actresses</h4>

            {actressSuggestions.map((name) => (
              <div
                key={name}
                className="suggestion"
                onClick={() => {
                  navigate(`/actress/${encodeURIComponent(name)}`);
                  clearSuggestions();
                }}
              >
                <PersonCircle/> {name}
              </div>
            ))}
          </>
        )}

        {studioSuggestions.length > 0 && (
          <>
            <h4>Studios</h4>

            {studioSuggestions.map((name) => (
              <div
                key={name}
                className="suggestion"
                onClick={() => {
                  navigate(`/studio/${encodeURIComponent(name)}`);
                  clearSuggestions();
                }}
              >
                <CameraReelsFill/> {name}
              </div>
            ))}
          </>
        )}
      </div>
)}
    </div>
  );
}

export default SearchForm;
