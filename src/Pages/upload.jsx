import { useState } from "react";
import "./upload.css";

export default function Upload() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [trailer, setTrailer] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailS, setThumbnailS] = useState("");
  const [actress, setActress] = useState("");
  const [studio, setStudio] = useState("");
  const [substudio, setSubstudio] = useState("");
  const [date, setDate] = useState("");

  const upload = async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}data/videos.json`);
    const videos = await res.json();

    const newVideo = {
      id: 1, // Temporary value
      title,
      src: url,
      trailer,
      thumbnail,
      thumbnail_s: thumbnailS,
      actress: actress
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      studio,
      substudio,
      date,
    };
    // Add new video to the top
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

    alert("videos.json downloaded successfully!");

    // Clear form
    setTitle("");
    setUrl("");
    setTrailer("");
    setThumbnail("");
    setThumbnailS("");
    setActress("");
    setStudio("");
    setSubstudio("");
    setDate("");
  };
  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Upload Video</h2>

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
            type="text"
            placeholder="Jade Kush, Emily"
            value={actress}
            onChange={(e) => setActress(e.target.value)}
          />
        </div>

        <div className="upload-group">
          <label>Studio</label>
          <input
            type="text"
            placeholder="Studio Name"
            value={studio}
            onChange={(e) => setStudio(e.target.value)}
          />
        </div>

        <div className="upload-group">
          <label>Sub Studio (Optional)</label>
          <input
            type="text"
            placeholder="Sub Studio"
            value={substudio}
            onChange={(e) => setSubstudio(e.target.value)}
          />
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
