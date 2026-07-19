import { useState, useEffect } from "react";
import "./upload.css";

export default function Upload() {
  const [category, setCategory] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [trailer, setTrailer] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailS, setThumbnailS] = useState("");
  const [actress, setActress] = useState("");
  const [network, setNetwork] = useState("");
  const [channel, setChannel] = useState("");
  const [series, setSeries] = useState("");
  const [date, setDate] = useState("");

  // Suggestions
  const [categoryList, setCategoryList] = useState([]);
  const [actressList, setActressList] = useState([]);
  const [networkList, setNetworkList] = useState([]);
  const [channelList, setChannelList] = useState([]);
  const [seriesList, setSeriesList] = useState([]);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/videos.json`);

        if (!res.ok) return;

        const videos = await res.json();

        // Category
        const categories = [
          ...new Set(videos.map((v) => v.category).filter(Boolean)),
        ].sort();

        // Actress
        const actresses = [
          ...new Set(
            videos.flatMap((v) => (Array.isArray(v.actress) ? v.actress : [])),
          ),
        ].sort();

        // Network
        const networks = [
          ...new Set(videos.map((v) => v.network || v.studio).filter(Boolean)),
        ].sort();

        // Channel
        const channels = [
          ...new Set(videos.map((v) => v.channel).filter(Boolean)),
        ].sort();

        // Series
        const serieses = [
          ...new Set(videos.map((v) => v.series).filter(Boolean)),
        ].sort();

        setCategoryList(categories);
        setActressList(actresses);
        setNetworkList(networks);
        setChannelList(channels);
        setSeriesList(serieses);
      } catch (err) {
        console.error(err);
      }
    };

    loadSuggestions();
  }, []);

  const upload = async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}data/videos.json`);

    if (!res.ok) {
      alert("videos.json not found!");
      return;
    }

    const videos = await res.json();

    const newVideo = {
  id: 1,
  category,
  ...(code.trim() && { code: code.trim() }),
  title,
  src: url,
  trailer,
  thumbnail,
  thumbnail_s: thumbnailS,
  actress: actress
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean),
  network,
  channel,
  series,
  date,
};

    // Add to top
    videos.unshift(newVideo);

    // Renumber IDs
    videos.forEach((video, index) => {
      video.id = index + 1;
    });

    const blob = new Blob([JSON.stringify(videos, null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "videos.json";
    a.click();

    URL.revokeObjectURL(a.href);

    alert("videos.json downloaded successfully!");

    // Clear form
    setCategory("");
    setCode("");
    setTitle("");
    setUrl("");
    setTrailer("");
    setThumbnail("");
    setThumbnailS("");
    setActress("");
    setNetwork("");
    setChannel("");
    setSeries("");
    setDate("");
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Upload Video</h2>

        <div className="upload-group">
          <label>Category</label>
          <input
            list="category-list"
            type="text"
            placeholder="American"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <datalist id="category-list">
            {categoryList.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        {["jav", "china"].includes(category.toLowerCase()) && (
  <div className="upload-group">
    <label>Code (Optional)</label>
    <input
      type="text"
      placeholder={
        category.toLowerCase() === "jav"
          ? "jpy-2001"
          : "MD0270-1"
      }
      value={code}
      onChange={(e) => setCode(e.target.value)}
    />
  </div>
)}

        <div className="upload-group">
          <label>Title</label>
          <input
            type="text"
            placeholder="Enter Video Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="upload-group">
          <label>Video URL</label>
          <input
            type="text"
            placeholder="Paste Video URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="upload-group">
          <label>Trailer URL</label>
          <input
            type="text"
            placeholder="Paste Trailer URL"
            value={trailer}
            onChange={(e) => setTrailer(e.target.value)}
          />
        </div>

        <div className="upload-group">
          <label>Thumbnail URL</label>
          <input
            type="text"
            placeholder="Paste Thumbnail URL"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
          />
        </div>

        <div className="upload-group">
          <label>Small Thumbnail URL</label>
          <input
            type="text"
            placeholder="Paste Small Thumbnail URL"
            value={thumbnailS}
            onChange={(e) => setThumbnailS(e.target.value)}
          />
        </div>

        <div className="upload-group">
          <label>Actress (comma separated)</label>
          <input
            list="actress-list"
            type="text"
            placeholder="Jade Kush, Emily"
            value={actress}
            onChange={(e) => setActress(e.target.value)}
          />

          <datalist id="actress-list">
            {actressList.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="upload-group">
          <label>Network</label>
          <input
            list="network-list"
            type="text"
            placeholder="Network Name"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
          />

          <datalist id="network-list">
            {networkList.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="upload-group">
          <label>Channel (Optional)</label>
          <input
            list="channel-list"
            type="text"
            placeholder="Channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />

          <datalist id="channel-list">
            {channelList.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="upload-group">
          <label>Series (Optional)</label>
          <input
            list="series-list"
            type="text"
            placeholder="Series Name"
            value={series}
            onChange={(e) => setSeries(e.target.value)}
          />

          <datalist id="series-list">
            {seriesList.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="upload-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button className="upload-btn" onClick={upload}>
          Upload
        </button>
      </div>
    </div>
  );
}
