import VideoCard from "../videocard/videocard";

function RecommendedVideos({ videos, currentVideo }) {
  if (!currentVideo) return null;

  const getScore = (video) => {
    let score = 0;

    // Same Actress
    if (currentVideo.actress.some((name) => video.actress.includes(name))) {
      score += 100;
    }

    // Same Sub Studio
    if (currentVideo.subStudio && currentVideo.subStudio === video.subStudio) {
      score += 50;
    }

    // Same Studio
    if (currentVideo.studio === video.studio) {
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
    <>
      <div className="main">
        <div className="content">
          <h2 className="video-count">You May Like Also</h2>
          <div className="video-list">
            {recommended.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default RecommendedVideos;
