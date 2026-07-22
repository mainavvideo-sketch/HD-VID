import VideoCard from "../videocard/videocard";
import "./recommended.css";

function RecommendedVideos({ videos, currentVideo }) {
  if (!currentVideo) return null;

  const getScore = (video) => {
    let score = 0;

    // Same Actress
    if (currentVideo.actress.some((name) => video.actress.includes(name))) {
      score += 100;
    }

    // Same Sub Studio
    if (currentVideo.channel && currentVideo.channel === video.channel) {
      score += 50;
    }

    // Same Studio
    if (currentVideo.network === video.network) {
      score += 25;
    }

    return score;
  };

  const recommended = videos
    .filter((video) => video.id !== currentVideo.id)
    .map((video) => ({
      ...video,
      score: getScore(video),
    }))
    .filter((video) => video.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  return (
    <div className="recommended">
      <div className="content">
        <div className="category-header">
          <h2 className="category-title">
            You May Like Also
            <span className="title-sub">Based on this video</span>
          </h2>
          {recommended.length > 0 && (
            <span className="category-count">{recommended.length}</span>
          )}
        </div>

        {recommended.length > 0 ? (
          <div className="video-list">
            {recommended.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="recommended-empty">
            <div className="empty-icon">+</div>
            <div className="empty-title">Nothing similar yet</div>
            <div className="empty-sub">
              We couldn't find other videos sharing this one's actress,
              channel, or studio.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendedVideos;
