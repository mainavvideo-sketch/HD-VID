import { Link } from "react-router-dom";
import "./trendingcard.css";
import React from "react";
import loading2 from "../../assets/loading2.gif";
import { useState } from "react";

function TrendingCard({ video, rank }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const isHot = typeof rank === "number" && rank <= 3;

  return (
    <div className={`trending-card${isHot ? " trending-card--hot" : ""}`}>
      <div className={`trending-overlay${isLoaded ? "" : " is-loading"}`}>
        {typeof rank === "number" && (
          <span className="trending-rank">
            {isHot && <span className="flame-mini">🔥</span>}
            {String(rank).padStart(2, "0")}
          </span>
        )}

        {!isLoaded && (
          <img className="loading-icon" src={loading2} alt="Loading" />
        )}

        <img
          src={video.thumbnail_s}
          className="thumbnail"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          style={{ display: isLoaded ? "block" : "none" }}
        />

        <div className="trending-title-strip" aria-hidden="true">
          <h1 className="video-title">{video.title}</h1>
        </div>

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
