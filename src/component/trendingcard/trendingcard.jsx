import { Link } from "react-router-dom";
import "./trendingcard.css";
import React from "react";


function TrendingCard({ video }) {
  return (
    <div className="trending-card">
      <div className="trending-overlay">
        <Link to={`/watch/${video.id}`}>
          <img
            src={video.thumbnail_s}
            className="thumbnail"
            alt={video.title}
          />
        </Link>

        <div className="trending-meta">
          <div className="trending-overlay-content">
          <Link to={`/watch/${video.id}`}>
            <h1 className="video-title">{video.title}</h1>
          </Link>

           <div className="meta-info">
                    <div className="actress">
            <span>
              {video.actress.map((name, index) => (
                <React.Fragment key={index}>
                  <Link to={`/actress/${encodeURIComponent(name)}`}>
                    {name}
                  </Link>
                  {index < video.actress.length - 1 && ", "}
                </React.Fragment>
              ))}
            </span>
          </div>
          <div className="network">
            <span>
              <Link
                to={
                  video.channel
                    ? `/channel/${encodeURIComponent(video.channel)}`
                    : `/network/${encodeURIComponent(video.network)}`
                }
              >
                {video.channel || video.network}
              </Link>
            </span>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrendingCard;
