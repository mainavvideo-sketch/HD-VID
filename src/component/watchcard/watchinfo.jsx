import { Link } from "react-router-dom";
import "./watchinfo.css";

function WatchInfo({ video }) {
  return (
    <div className="whatch-info-th">
      
      <div className="watch-info">
        <h2>{video.title}</h2>

        <p>
          <strong>network:</strong>{" "}
          <span>
            <Link to={`/network/${encodeURIComponent(video.network)}`}>
              {video.network}
            </Link>
          </span>
        </p>
        {video.channel && (
          <p>
            <strong>Sub network:</strong>{" "}
            <span>
              <Link to={`/channel/${encodeURIComponent(video.channel)}`}>
                {video.channel}
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

        {video.series && (
          <p>
            <strong>Series:</strong>{" "}
            <span>
              <Link to={`/series/${encodeURIComponent(video.series)}`}>
                {video.series}
              </Link>
            </span>
          </p>
        )}


      </div>
    </div>
  );
}

export default WatchInfo;
