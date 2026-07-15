import { Link } from "react-router-dom";
import "./watchinfo.css";

function WatchInfo({ video }) {
  return (
    <div className="whatch-info-th">
      
      <div className="watch-info">
        <h2>{video.title}</h2>

        <p>
          <strong>Studio:</strong>{" "}
          <span>
            <Link to={`/studio/${encodeURIComponent(video.studio)}`}>
              {video.studio}
            </Link>
          </span>
        </p>
        {video.subStudio && (
          <p>
            <strong>Sub Studio:</strong>{" "}
            <span>
              <Link to={`/studio/${encodeURIComponent(video.subStudio)}`}>
                {video.subStudio}
              </Link>
            </span>
          </p>
        )}
        <p>
          <strong>Actress:</strong>{" "}
          {video.actress.map((name, index) => (
            <span key={index}>
              <Link to={`/actress/${encodeURIComponent(name)}`}>{name}</Link>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

export default WatchInfo;
