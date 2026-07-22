import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PersonCircle } from "react-bootstrap-icons";
import { CameraReelsFill } from "react-bootstrap-icons";
import { Tv } from "react-bootstrap-icons";
import { Search } from "react-bootstrap-icons";
import "./search.css";
function SearchForm() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [videoSuggestions, setVideoSuggestions] = useState([]);
  const [actressSuggestions, setActressSuggestions] = useState([]);
  const [networkSuggestions, setNetworkSuggestions] = useState([]);
  const [channelSuggestions, setChannelSuggestions] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const clearSuggestions = () => {
    setSearch("");
    setVideoSuggestions([]);
    setActressSuggestions([]);
    setNetworkSuggestions([]);
    setChannelSuggestions([]);
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
      setNetworkSuggestions([]);
      setChannelSuggestions([]);
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

    // Networks (unique)
    const networks = [
      ...new Set(videos.map((video) => video.network)),
    ]
      .filter(Boolean)
      .filter((name) => name.toLowerCase().includes(keyword));

    // Channels (unique)
    const channels = [
      ...new Set(videos.map((video) => video.channel)),
    ]
      .filter(Boolean)
      .filter((name) => name.toLowerCase().includes(keyword));

    setVideoSuggestions(videosFound.slice(0, 5));
    setActressSuggestions(actresses.slice(0, 5));
    setNetworkSuggestions(networks.slice(0, 5));
    setChannelSuggestions(channels.slice(0, 5));
  }, [search, videos]);


  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target)
    ) {
      setVideoSuggestions([]);
      setActressSuggestions([]);
      setNetworkSuggestions([]);
      setChannelSuggestions([]);
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
  networkSuggestions.length ||
  channelSuggestions.length) > 0 && (
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

        {networkSuggestions.length > 0 && (
          <>
            <h4>Networks</h4>

            {networkSuggestions.map((name) => (
              <div
                key={name}
                className="suggestion"
                onClick={() => {
                  navigate(`/network/${encodeURIComponent(name)}`);
                  clearSuggestions();
                }}
              >
                <CameraReelsFill/> {name}
              </div>
            ))}
          </>
        )}

        {channelSuggestions.length > 0 && (
          <>
            <h4>Channels</h4>

            {channelSuggestions.map((name) => (
              <div
                key={name}
                className="suggestion"
                onClick={() => {
                  navigate(`/channel/${encodeURIComponent(name)}`);
                  clearSuggestions();
                }}
              >
                <Tv/> {name}
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
