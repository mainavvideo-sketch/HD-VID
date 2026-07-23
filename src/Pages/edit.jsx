import { useState, useEffect, useRef } from "react";
import "./edit.css";

// Category, title, video URL and thumbnail are the fields every catalog
// entry needs to be usable — everything else is supporting detail.
const REQUIRED_FIELDS = ["category", "title", "url", "thumbnail"];
const MAX_SUGGESTIONS = 4;
const MAX_PICKER_MATCHES = 6;
const DELETE_CONFIRM_WINDOW = 3200;

export default function EditPage() {
  // Full catalog + selection
  const [videos, setVideos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Form fields
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const fieldRefs = useRef({});
  const confirmTimerRef = useRef(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/videos.json`);

        if (!res.ok) {
          setToast({ message: "videos.json not found.", type: "error" });
          return;
        }

        const data = await res.json();
        setVideos(data);

        const categories = [
          ...new Set(data.map((v) => v.category).filter(Boolean)),
        ].sort();

        const actresses = [
          ...new Set(
            data.flatMap((v) => (Array.isArray(v.actress) ? v.actress : [])),
          ),
        ].sort();

        const networks = [
          ...new Set(data.map((v) => v.network || v.studio).filter(Boolean)),
        ].sort();

        const channels = [
          ...new Set(data.map((v) => v.channel).filter(Boolean)),
        ].sort();

        const serieses = [
          ...new Set(data.map((v) => v.series).filter(Boolean)),
        ].sort();

        setCategoryList(categories);
        setActressList(actresses);
        setNetworkList(networks);
        setChannelList(channels);
        setSeriesList(serieses);
      } catch (err) {
        console.error(err);
        setToast({ message: "Couldn't load videos.json.", type: "error" });
      } finally {
        setIsLoadingCatalog(false);
      }
    };

    loadCatalog();
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

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

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

  const clearForm = () => {
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

  const selectVideo = (video) => {
    setSelectedId(video.id);
    setCategory(video.category || "");
    setCode(video.code || "");
    setTitle(video.title || "");
    setUrl(video.src || "");
    setTrailer(video.trailer || "");
    setThumbnail(video.thumbnail || "");
    setThumbnailS(video.thumbnail_s || "");
    setVtt(video.vtt || "");
    setVttTouched(Boolean(video.vtt));
    setActress(Array.isArray(video.actress) ? video.actress.join(", ") : "");
    setNetwork(video.network || video.studio || "");
    setChannel(video.channel || "");
    setSeries(video.series || "");
    setDate(video.date || "");
    setErrors({});
    setPickerQuery("");
    setPickerOpen(false);
    setConfirmingDelete(false);
  };

  const cancelEdit = () => {
    setSelectedId(null);
    setPickerQuery("");
    setConfirmingDelete(false);
    clearForm();
  };

  const downloadCatalog = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "videos.json";
    a.click();

    URL.revokeObjectURL(a.href);
  };

  const saveChanges = async () => {
    if (selectedId == null) return;

    if (!validate()) {
      setToast({ message: "Fill in the required fields before saving.", type: "error" });
      return;
    }

    setIsSaving(true);

    try {
      const updatedVideo = {
        id: selectedId,
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

      const nextVideos = videos.map((v) =>
        v.id === selectedId ? updatedVideo : v,
      );

      setVideos(nextVideos);
      downloadCatalog(nextVideos);

      setToast({ message: "videos.json updated successfully.", type: "success" });
      cancelEdit();
    } catch (err) {
      console.error(err);
      setToast({ message: "Something went wrong. Try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Deleting is destructive, so the button arms itself first: one click
  // asks for confirmation, a second click within the window commits it.
  const handleDeleteClick = () => {
    if (selectedId == null) return;

    if (!confirmingDelete) {
      setConfirmingDelete(true);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmingDelete(false);
      }, DELETE_CONFIRM_WINDOW);
      return;
    }

    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    deleteVideo();
  };

  const deleteVideo = async () => {
    if (selectedId == null) return;

    setConfirmingDelete(false);
    setIsDeleting(true);

    try {
      const nextVideos = videos
        .filter((v) => v.id !== selectedId)
        .map((v, index) => ({ ...v, id: index + 1 }));

      setVideos(nextVideos);
      downloadCatalog(nextVideos);

      setToast({ message: "Entry deleted. videos.json downloaded.", type: "success" });
      cancelEdit();
    } catch (err) {
      console.error(err);
      setToast({ message: "Something went wrong. Try again.", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedVideo = videos.find((v) => v.id === selectedId) || null;
  const showCode = ["jav", "china"].includes(category.toLowerCase());
  const showChannel = !showCode;
  const isBusy = isSaving || isDeleting;

  const groupClass = (field) =>
    `edit-group${errors[field] ? " has-error" : ""}${shakeFields[field] ? " edit-shake" : ""}`;

  return (
    <div className="edit-page">
      <div className="edit-card">
        <h2>Edit Video</h2>
        <p className="edit-subtitle">Update or remove an entry in the catalog</p>

        {/* --- Picker --- */}
        <div className="edit-section">
          <div className="edit-section-title">Find entry</div>

          <div className="edit-group">
            <label htmlFor="field-picker">
              Search by title or code
            </label>
            <VideoPicker
              id="field-picker"
              placeholder={
                isLoadingCatalog ? "Loading catalog…" : "Start typing a title…"
              }
              disabled={isLoadingCatalog}
              query={pickerQuery}
              onQueryChange={setPickerQuery}
              open={pickerOpen}
              setOpen={setPickerOpen}
              videos={videos}
              onSelect={selectVideo}
            />

            {selectedVideo && (
              <div className="edit-selected-banner">
                <span className="edit-selected-banner-text">
                  Editing <strong>{selectedVideo.title}</strong>
                </span>
                <button
                  type="button"
                  className="edit-selected-clear"
                  onClick={cancelEdit}
                  disabled={isBusy}
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        {!selectedVideo ? (
          <div
            className={`edit-empty-state${
              pickerOpen && pickerQuery.trim() ? " edit-empty-state-hidden" : ""
            }`}
          >
            {isLoadingCatalog
              ? "Loading videos.json…"
              : "Search for an entry above to start editing."}
          </div>
        ) : (
          <>
            {/* --- Completion progress --- */}
            <div className="edit-progress-wrap">
              <div className="edit-progress-top">
                <span className="edit-progress-label">Required fields</span>
                <span className={`edit-progress-count${isComplete ? " complete" : ""}`}>
                  {isComplete ? "All set" : `${requiredDoneCount} of ${requiredTotal}`}
                  <svg
                    className="edit-progress-check"
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
                className="edit-progress-track"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Required fields completed"
              >
                <div
                  className={`edit-progress-fill${isComplete ? " complete" : ""}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* --- Basics --- */}
            <div className="edit-section">
              <div className="edit-section-title">Basics</div>

              <div className={groupClass("category")}>
                <label htmlFor="field-category">
                  Category <span className="edit-required">*</span>
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
                  <div className="edit-error-text">{errors.category}</div>
                )}
              </div>

              {showCode && (
                <div className="edit-group">
                  <label htmlFor="field-code">
                    Code <span className="edit-optional-tag">Optional</span>
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
                  Title <span className="edit-required">*</span>
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
                {errors.title && <div className="edit-error-text">{errors.title}</div>}
              </div>

              <div className="edit-group">
                <label htmlFor="field-date">
                  Date <span className="edit-optional-tag">Optional</span>
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
            <div className="edit-section">
              <div className="edit-section-title">Media</div>

              <div className={groupClass("url")}>
                <label htmlFor="field-url">
                  Video URL <span className="edit-required">*</span>
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
                {errors.url && <div className="edit-error-text">{errors.url}</div>}
              </div>

              <div className="edit-group">
                <label htmlFor="field-trailer">
                  Trailer URL <span className="edit-optional-tag">Optional</span>
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
            <div className="edit-section">
              <div className="edit-section-title">
                Thumbnails <span className="edit-section-hint">+ scrub preview</span>
              </div>

              <div className="edit-row">
                <div className={groupClass("thumbnail")}>
                  <label htmlFor="field-thumbnail">
                    Thumbnail <span className="edit-required">*</span>
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
                    <div className="edit-error-text">{errors.thumbnail}</div>
                  )}
                  <ThumbnailPreview src={thumbnail} label="No preview yet" />
                </div>

                <div className="edit-group">
                  <label htmlFor="field-thumbnail-s">
                    Small thumbnail <span className="edit-optional-tag">Optional</span>
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

              <div className="edit-vtt-note">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M8 7.2V11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
                </svg>
                <span>
                  The VTT file indexes these thumbnails so the player can show
                  a scrub preview. It fills in automatically from the category
                  and code or title above — edit it directly only if this
                  entry needs a custom path.
                </span>
              </div>

              <div className="edit-group">
                <label htmlFor="field-vtt">
                  VTT path <span className="edit-optional-tag">Optional</span>
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
                    className="edit-auto-link"
                    onClick={() => setVttTouched(false)}
                  >
                    Reset to auto-generated
                  </button>
                )}
              </div>
            </div>

            {/* --- Attribution --- */}
            <div className="edit-section">
              <div className="edit-section-title">Attribution</div>

              <div className="edit-group">
                <label htmlFor="field-actress">
                  Actress <span className="edit-optional-tag">Comma separated</span>
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

              <div className="edit-row">
                <div className="edit-group">
                  <label htmlFor="field-network">
                    Network <span className="edit-optional-tag">Optional</span>
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
                  <div className="edit-group">
                    <label htmlFor="field-channel">
                      Channel <span className="edit-optional-tag">Optional</span>
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

              <div className="edit-group">
                <label htmlFor="field-series">
                  Series <span className="edit-optional-tag">Optional</span>
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

            <div className="edit-actions">
              <button
                type="button"
                className={`edit-btn-danger${confirmingDelete ? " confirming" : ""}`}
                onClick={handleDeleteClick}
                disabled={isBusy}
              >
                {isDeleting
                  ? "Deleting…"
                  : confirmingDelete
                    ? "Confirm delete?"
                    : "Delete"}
              </button>
              <button
                type="button"
                className="edit-btn-reset"
                onClick={cancelEdit}
                disabled={isBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="edit-btn"
                onClick={saveChanges}
                disabled={isBusy}
              >
                {isSaving && <span className="edit-spinner" aria-hidden="true" />}
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className={`edit-toast ${toast.type}`} role="status">
          <span className="edit-toast-dot" aria-hidden="true" />
          {toast.message}
        </div>
      )}
    </div>
  );
}

function VideoPicker({
  id,
  placeholder,
  disabled,
  query,
  onQueryChange,
  open,
  setOpen,
  videos,
  onSelect,
}) {
  const trimmed = query.trim().toLowerCase();

  const matches = trimmed
    ? videos
        .filter(
          (v) =>
            v.title?.toLowerCase().includes(trimmed) ||
            v.code?.toLowerCase().includes(trimmed),
        )
        .slice(0, MAX_PICKER_MATCHES)
    : [];

  return (
    <div className={`edit-suggest${open && trimmed ? " open" : ""}`}>
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && trimmed && (
        <ul className="edit-suggest-list">
          {matches.length > 0 ? (
            matches.map((v) => (
              <li
                key={v.id}
                className="edit-picker-item"
                onMouseDown={() => onSelect(v)}
              >
                <span>{v.title}</span>
                <span className="edit-picker-item-meta">
                  {v.code || v.category || ""}
                </span>
              </li>
            ))
          ) : (
            <li className="edit-picker-empty">No matching entries</li>
          )}
        </ul>
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
    <div className={`edit-suggest${open && matches.length > 0 ? " open" : ""}`}>
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
        <ul className="edit-suggest-list">
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
    return <div className="edit-preview">{label}</div>;
  }

  if (failed) {
    return <div className="edit-preview">Couldn't load image</div>;
  }

  return (
    <div className={`edit-preview${loaded ? " loaded" : ""}`}>
      <img
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
