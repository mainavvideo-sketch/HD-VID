import { useState, useEffect, useRef } from "react";
import "./upload.css";

// Category, title, video URL and thumbnail are the fields every catalog
// entry needs to be usable — everything else is supporting detail.
const REQUIRED_FIELDS = ["category", "title", "url", "thumbnail"];
const MAX_SUGGESTIONS = 4;

export default function Upload() {
  const [category, setCategory] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [trailer, setTrailer] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailS, setThumbnailS] = useState("");
  const [vtt, setVtt] = useState("");
  const [vttTouched, setVttTouched] = useState(false);
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

  // UX state
  const [errors, setErrors] = useState({});
  const [shakeFields, setShakeFields] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const fieldRefs = useRef({});

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/videos.json`);

        if (!res.ok) return;

        const videos = await res.json();

        const categories = [
          ...new Set(videos.map((v) => v.category).filter(Boolean)),
        ].sort();

        const actresses = [
          ...new Set(
            videos.flatMap((v) => (Array.isArray(v.actress) ? v.actress : [])),
          ),
        ].sort();

        const networks = [
          ...new Set(videos.map((v) => v.network || v.studio).filter(Boolean)),
        ].sort();

        const channels = [
          ...new Set(videos.map((v) => v.channel).filter(Boolean)),
        ].sort();

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // Auto-fill VTT path as ./thumbs/{category}/{code-or-title}.vtt
  // unless the user has manually edited the field.
  useEffect(() => {
    if (vttTouched) return;

    const base = code.trim() || title.trim();

    if (!category && !base) {
      setVtt("");
      return;
    }

    setVtt(`./thumbs/${category}/${base}.vtt`);
  }, [category, code, title, vttTouched]);

  const fieldValues = { category, title, url, thumbnail };

  const requiredDoneCount = REQUIRED_FIELDS.filter((f) =>
    fieldValues[f]?.trim(),
  ).length;
  const requiredTotal = REQUIRED_FIELDS.length;
  const progressPct = Math.round((requiredDoneCount / requiredTotal) * 100);
  const isComplete = requiredDoneCount === requiredTotal;

  const validate = () => {
    const nextErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!fieldValues[field]?.trim()) {
        nextErrors[field] = "This field is required.";
      }
    });
    setErrors(nextErrors);

    const invalidFields = Object.keys(nextErrors);
    if (invalidFields.length > 0) {
      const shakeMap = {};
      invalidFields.forEach((f) => {
        shakeMap[f] = true;
      });
      setShakeFields(shakeMap);
      setTimeout(() => setShakeFields({}), 420);

      const firstInvalid = invalidFields[0];
      fieldRefs.current[firstInvalid]?.focus();
    }

    return invalidFields.length === 0;
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const resetForm = () => {
    setCategory("");
    setCode("");
    setTitle("");
    setUrl("");
    setTrailer("");
    setThumbnail("");
    setThumbnailS("");
    setVtt("");
    setVttTouched(false);
    setActress("");
    setNetwork("");
    setChannel("");
    setSeries("");
    setDate("");
    setErrors({});
  };

  const upload = async () => {
    if (!validate()) {
      setToast({ message: "Fill in the required fields before uploading.", type: "error" });
      return;
    }

    setIsUploading(true);

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/videos.json`);

      if (!res.ok) {
        setToast({ message: "videos.json not found.", type: "error" });
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
        ...(vtt.trim() && { vtt: vtt.trim() }),
        actress: actress
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        network,
        channel,
        series,
        date,
      };

      videos.unshift(newVideo);

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

      setToast({ message: "videos.json downloaded successfully.", type: "success" });
      resetForm();
    } catch (err) {
      console.error(err);
      setToast({ message: "Something went wrong. Try again.", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const showCode = ["jav", "china"].includes(category.toLowerCase());
  const showChannel = !showCode;

  const groupClass = (field) =>
    `upload-group${errors[field] ? " has-error" : ""}${shakeFields[field] ? " upload-shake" : ""}`;

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h2>Upload Video</h2>
        <p className="upload-subtitle">Add a new entry to the catalog</p>

        {/* --- Completion progress --- */}
        <div className="upload-progress-wrap">
          <div className="upload-progress-top">
            <span className="upload-progress-label">Required fields</span>
            <span className={`upload-progress-count${isComplete ? " complete" : ""}`}>
              {isComplete ? "All set" : `${requiredDoneCount} of ${requiredTotal}`}
              <svg
                className="upload-progress-check"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8.5L6.2 11.5L13 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div
            className="upload-progress-track"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Required fields completed"
          >
            <div
              className={`upload-progress-fill${isComplete ? " complete" : ""}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* --- Basics --- */}
        <div className="upload-section">
          <div className="upload-section-title">Basics</div>

          <div className={groupClass("category")}>
            <label htmlFor="field-category">
              Category <span className="upload-required">*</span>
            </label>
            <select
              id="field-category"
              ref={(el) => (fieldRefs.current.category = el)}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                clearFieldError("category");
              }}
            >
              <option value="">Select a category</option>
              <option value="American">American</option>
              <option value="JAV">JAV</option>
              <option value="China">China</option>
              {categoryList
                .filter((c) => !["American", "Jav", "China"].includes(c))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
            {errors.category && (
              <div className="upload-error-text">{errors.category}</div>
            )}
          </div>

          {showCode && (
            <div className="upload-group">
              <label htmlFor="field-code">
                Code <span className="upload-optional-tag">Optional</span>
              </label>
              <input
                id="field-code"
                type="text"
                placeholder={
                  category.toLowerCase() === "jav" ? "jpy-2001" : "MD0270-1"
                }
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          )}

          <div className={groupClass("title")}>
            <label htmlFor="field-title">
              Title <span className="upload-required">*</span>
            </label>
            <input
              id="field-title"
              ref={(el) => (fieldRefs.current.title = el)}
              type="text"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearFieldError("title");
              }}
            />
            {errors.title && <div className="upload-error-text">{errors.title}</div>}
          </div>

          <div className="upload-group">
            <label htmlFor="field-date">
              Date <span className="upload-optional-tag">Optional</span>
            </label>
            <input
              id="field-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* --- Media --- */}
        <div className="upload-section">
          <div className="upload-section-title">Media</div>

          <div className={groupClass("url")}>
            <label htmlFor="field-url">
              Video URL <span className="upload-required">*</span>
            </label>
            <input
              id="field-url"
              ref={(el) => (fieldRefs.current.url = el)}
              type="text"
              placeholder="Paste video URL"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                clearFieldError("url");
              }}
            />
            {errors.url && <div className="upload-error-text">{errors.url}</div>}
          </div>

          <div className="upload-group">
            <label htmlFor="field-trailer">
              Trailer URL <span className="upload-optional-tag">Optional</span>
            </label>
            <input
              id="field-trailer"
              type="text"
              placeholder="Paste trailer URL"
              value={trailer}
              onChange={(e) => setTrailer(e.target.value)}
            />
          </div>
        </div>

        {/* --- Thumbnails & preview track ---
             Grouped together because the VTT file is what powers the
             scrubbing preview built from these same thumbnails. */}
        <div className="upload-section">
          <div className="upload-section-title">
            Thumbnails <span className="upload-section-hint">+ scrub preview</span>
          </div>

          <div className="upload-row">
            <div className={groupClass("thumbnail")}>
              <label htmlFor="field-thumbnail">
                Thumbnail <span className="upload-required">*</span>
              </label>
              <input
                id="field-thumbnail"
                ref={(el) => (fieldRefs.current.thumbnail = el)}
                type="text"
                placeholder="Paste thumbnail URL"
                value={thumbnail}
                onChange={(e) => {
                  setThumbnail(e.target.value);
                  clearFieldError("thumbnail");
                }}
              />
              {errors.thumbnail && (
                <div className="upload-error-text">{errors.thumbnail}</div>
              )}
              <ThumbnailPreview src={thumbnail} label="No preview yet" />
            </div>

            <div className="upload-group">
              <label htmlFor="field-thumbnail-s">
                Small thumbnail <span className="upload-optional-tag">Optional</span>
              </label>
              <input
                id="field-thumbnail-s"
                type="text"
                placeholder="Paste small thumbnail URL"
                value={thumbnailS}
                onChange={(e) => setThumbnailS(e.target.value)}
              />
              <ThumbnailPreview src={thumbnailS} label="No preview yet" />
            </div>
          </div>

          <div className="upload-vtt-note">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 7.2V11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
            </svg>
            <span>
              The VTT file indexes these thumbnails so the player can show a
              scrub preview. It fills in automatically from the category and
              code or title above — edit it directly only if this entry needs
              a custom path.
            </span>
          </div>

          <div className="upload-group">
            <label htmlFor="field-vtt">
              VTT path <span className="upload-optional-tag">Optional</span>
            </label>
            <input
              id="field-vtt"
              type="text"
              placeholder="./thumbs/category/code-or-title.vtt"
              value={vtt}
              onChange={(e) => {
                setVtt(e.target.value);
                setVttTouched(true);
              }}
            />
            {vttTouched && (
              <button
                type="button"
                className="upload-auto-link"
                onClick={() => setVttTouched(false)}
              >
                Reset to auto-generated
              </button>
            )}
          </div>
        </div>

        {/* --- Attribution --- */}
        <div className="upload-section">
          <div className="upload-section-title">Attribution</div>

          <div className="upload-group">
            <label htmlFor="field-actress">
              Actress <span className="upload-optional-tag">Comma separated</span>
            </label>
            <SuggestField
              id="field-actress"
              placeholder="Jade Kush, Emily"
              value={actress}
              onChange={setActress}
              options={actressList}
              commaSeparated
            />
          </div>

          <div className="upload-row">
            <div className="upload-group">
              <label htmlFor="field-network">
                Network <span className="upload-optional-tag">Optional</span>
              </label>
              <SuggestField
                id="field-network"
                placeholder="Network name"
                value={network}
                onChange={setNetwork}
                options={networkList}
              />
            </div>

            {showChannel && (
              <div className="upload-group">
                <label htmlFor="field-channel">
                  Channel <span className="upload-optional-tag">Optional</span>
                </label>
                <SuggestField
                  id="field-channel"
                  placeholder="Channel"
                  value={channel}
                  onChange={setChannel}
                  options={channelList}
                />
              </div>
            )}
          </div>

          <div className="upload-group">
            <label htmlFor="field-series">
              Series <span className="upload-optional-tag">Optional</span>
            </label>
            <SuggestField
              id="field-series"
              placeholder="Series name"
              value={series}
              onChange={setSeries}
              options={seriesList}
            />
          </div>
        </div>

        <div className="upload-actions">
          <button
            type="button"
            className="upload-btn-reset"
            onClick={resetForm}
            disabled={isUploading}
          >
            Reset
          </button>
          <button
            type="button"
            className="upload-btn"
            onClick={upload}
            disabled={isUploading}
          >
            {isUploading && <span className="upload-spinner" aria-hidden="true" />}
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`upload-toast ${toast.type}`} role="status">
          <span className="upload-toast-dot" aria-hidden="true" />
          {toast.message}
        </div>
      )}
    </div>
  );
}

function SuggestField({ id, value, onChange, options, placeholder, commaSeparated = false }) {
  const [open, setOpen] = useState(false);

  // For comma-separated fields, only match against the segment being typed right now
  const query = commaSeparated ? value.slice(value.lastIndexOf(",") + 1).trim() : value.trim();

  const matches = query
    ? options
        .filter(
          (opt) =>
            opt.toLowerCase().includes(query.toLowerCase()) &&
            opt.toLowerCase() !== query.toLowerCase(),
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const handleSelect = (opt) => {
    if (commaSeparated) {
      const lastComma = value.lastIndexOf(",");
      const prefix = lastComma >= 0 ? `${value.slice(0, lastComma + 1)} ` : "";
      onChange(`${prefix}${opt}, `);
    } else {
      onChange(opt);
    }
    setOpen(false);
  };

  return (
    <div className="upload-suggest">
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && matches.length > 0 && (
        <ul className="upload-suggest-list">
          {matches.map((opt) => (
            <li key={opt} onMouseDown={() => handleSelect(opt)}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ThumbnailPreview({ src, label }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src) {
    return <div className="upload-preview">{label}</div>;
  }

  if (failed) {
    return <div className="upload-preview">Couldn't load image</div>;
  }

  return (
    <div className={`upload-preview${loaded ? " loaded" : ""}`}>
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}