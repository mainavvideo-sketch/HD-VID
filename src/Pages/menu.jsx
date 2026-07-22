import { Link } from "react-router-dom";
import "./menu.css";

// Assumes routes "/upload" and "/edit" are registered in your router.
// If your route paths differ, just update the `to` props below.
export default function Menu() {
  return (
    <div className="menu-page">
      <div className="menu-wrap">
        <div className="menu-header">
          <h2>Video Catalog</h2>
          <p className="menu-subtitle">What would you like to do?</p>
        </div>

        <div className="menu-options">
          <Link to="/upload" className="menu-option">
            <span className="menu-option-icon" aria-hidden="true">
              <UploadIcon />
            </span>
            <span className="menu-option-title">Upload</span>
            <span className="menu-option-desc">
              Add a new video entry to the catalog.
            </span>
          </Link>

          <Link to="/edit" className="menu-option">
            <span className="menu-option-icon" aria-hidden="true">
              <EditIcon />
            </span>
            <span className="menu-option-title">Edit</span>
            <span className="menu-option-desc">
              Find an existing entry and update or remove it.
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 16V4M12 4L7 9M12 4l5 5M5 20h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
