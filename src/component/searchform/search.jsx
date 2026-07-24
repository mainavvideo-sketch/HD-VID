import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { PersonCircle } from "react-bootstrap-icons";
import { CameraReelsFill } from "react-bootstrap-icons";
import { Tv } from "react-bootstrap-icons";
import { Search } from "react-bootstrap-icons";
import { XCircleFill } from "react-bootstrap-icons";
import { ArrowLeft } from "react-bootstrap-icons";
import "./search.css";

const RECENT_KEY = "recentSearches";
const RECENT_LIMIT = 6;
const DEBOUNCE_MS = 180;

// Wraps the substring of `text` that matches `query` in <mark>, so the
// dropdown shows people/titles the way they actually typed them.
function highlightMatch(text, query) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function SearchForm() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videoSuggestions, setVideoSuggestions] = useState([]);
  const [actressSuggestions, setActressSuggestions] = useState([]);
  const [networkSuggestions, setNetworkSuggestions] = useState([]);
  const [channelSuggestions, setChannelSuggestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState(getRecent);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  // .suggestions is portaled to document.body (see render below) so its
  // backdrop-filter can sample the real page behind it, instead of being
  // stuck inside nav's own blurred layer — nav has backdrop-filter too,
  // and an element with filter/backdrop-filter becomes a "backdrop root"
  // that descendants can't see past. Being a DOM child of nav meant the
  // dropdown could only blur nav's already-composited surface, which is
  // why the blur had no visible effect. suggestionsRef lets the
  // outside-click handler still recognize clicks inside the portaled
  // dropdown (React portals keep bubbling through the *React* tree, so
  // Escape/keydown handling on search-box is unaffected either way).
  const suggestionsRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 300 });

  const updateDropdownPosition = () => {
    const el = searchRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  const clearSuggestions = () => {
    setVideoSuggestions([]);
    setActressSuggestions([]);
    setNetworkSuggestions([]);
    setChannelSuggestions([]);
    setActiveIndex(-1);
  };

  const clearAll = () => {
    setSearch("");
    setDebouncedSearch("");
    clearSuggestions();
  };

  const saveRecent = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(
      0,
      RECENT_LIMIT,
    );
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode, quota) — recent search history is a nicety, not critical
    }
  };

  const removeRecent = (term) => {
    const next = recent.filter((r) => r !== term);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/videos.json`)
      .then((res) => res.json())
      .then((data) => setVideos(data))
      .finally(() => setVideosLoading(false));
  }, []);

  // Debounce so fast typers aren't re-filtering the whole catalogue on
  // every keystroke — only the settled value drives the search.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      clearSuggestions();
      return;
    }

    const keyword = debouncedSearch.toLowerCase();

    // Videos
    const videosFound = videos.filter((video) =>
      video.title.toLowerCase().includes(keyword),
    );

    // Actresses (unique)
    const actresses = [
      ...new Set(videos.flatMap((video) => video.actress)),
    ].filter((name) => name.toLowerCase().includes(keyword));

    // Networks (unique)
    const networks = [
      ...new Set(videos.map((video) => video.network)),
    ]
      .filter(Boolean)
      .filter((name) => name.toLowerCase().includes(keyword));

    // Channels (unique)
    const channels = [
      ...new Set(videos.map((video) => video.channel)),
    ]
      .filter(Boolean)
      .filter((name) => name.toLowerCase().includes(keyword));

    setVideoSuggestions(videosFound.slice(0, 5));
    setActressSuggestions(actresses.slice(0, 5));
    setNetworkSuggestions(networks.slice(0, 5));
    setChannelSuggestions(channels.slice(0, 5));
    setActiveIndex(-1);
  }, [debouncedSearch, videos]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const insideSearchBox = searchRef.current?.contains(event.target);
      // suggestionsRef.current is null while the dropdown isn't rendered,
      // so this check is skipped harmlessly in that case.
      const insideDropdown = suggestionsRef.current?.contains(event.target);
      if (!insideSearchBox && !insideDropdown) {
        clearSuggestions();
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    clearAll();
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock background scroll while the full-screen mobile overlay is open.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const showRecent = isFocused && !search.trim() && recent.length > 0;

  const hasSuggestions =
    videoSuggestions.length > 0 ||
    actressSuggestions.length > 0 ||
    networkSuggestions.length > 0 ||
    channelSuggestions.length > 0;

  const showNoResults =
    isFocused &&
    !videosLoading &&
    debouncedSearch.trim().length > 0 &&
    debouncedSearch === search &&
    !hasSuggestions;

  const showLoadingRow =
    isFocused && videosLoading && search.trim().length > 0 && !showRecent;

  const dropdownVisible =
    hasSuggestions || showRecent || showNoResults || showLoadingRow;

  // Flattened, ordered list of every actionable row currently on screen,
  // used to drive ArrowUp/ArrowDown + Enter without caring which category
  // a given index falls into.
  const flatItems = useMemo(() => {
    if (showRecent) {
      return recent.map((term) => ({ type: "recent", term }));
    }
    return [
      ...videoSuggestions.map((v) => ({ type: "video", data: v })),
      ...actressSuggestions.map((name) => ({ type: "actress", data: name })),
      ...networkSuggestions.map((name) => ({ type: "network", data: name })),
      ...channelSuggestions.map((name) => ({ type: "channel", data: name })),
    ];
  }, [
    showRecent,
    recent,
    videoSuggestions,
    actressSuggestions,
    networkSuggestions,
    channelSuggestions,
  ]);

  const activateItem = (item) => {
    if (!item) return;
    switch (item.type) {
      case "video":
        navigate(`/watch/${item.data.id}`);
        saveRecent(item.data.title);
        break;
      case "actress":
        navigate(`/actress/${encodeURIComponent(item.data)}`);
        saveRecent(item.data);
        break;
      case "network":
        navigate(`/network/${encodeURIComponent(item.data)}`);
        saveRecent(item.data);
        break;
      case "channel":
        navigate(`/channel/${encodeURIComponent(item.data)}`);
        saveRecent(item.data);
        break;
      case "recent":
        setSearch(item.term);
        setDebouncedSearch(item.term);
        return; // keep dropdown open so real suggestions can load, don't navigate
      default:
        return;
    }
    clearAll();
    setIsFocused(false);
    setMobileOpen(false);
  };

  // Keep the highlighted row scrolled into view as the user arrows past it.
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Measure before paint so the portaled dropdown never flashes at
  // a stale position when it first opens.
  useLayoutEffect(() => {
    if (dropdownVisible && !mobileOpen) {
      updateDropdownPosition();
    }
  }, [dropdownVisible, mobileOpen]);

  // Keep it aligned to the input while open, across resizes/reflows.
  useEffect(() => {
    if (!dropdownVisible || mobileOpen) return;
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [dropdownVisible, mobileOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && (dropdownVisible || mobileOpen)) {
      clearSuggestions();
      inputRef.current?.blur();
      setIsFocused(false);
      setMobileOpen(false);
      return;
    }

    if (!flatItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      activateItem(flatItems[activeIndex]);
    }
  };

  const handleClear = () => {
    clearAll();
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    setIsSubmitting(true);
    saveRecent(search);
    navigate(`/search/${encodeURIComponent(search)}`);
    clearAll();
    setIsFocused(false);
    setMobileOpen(false);
  };

  const openMobileOverlay = () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      setMobileOpen(true);
    }
  };

  const activeId = activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined;

  const dropdown = (
    <div
      className="suggestions"
      role="listbox"
      ref={(node) => {
        suggestionsRef.current = node;
        listRef.current = node;
      }}
      id="search-listbox"
      style={
        mobileOpen
          ? undefined
          : {
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }
      }
    >
      {showRecent && (
        <>
          <h4>Recent</h4>
          {recent.map((term, i) => (
            <div
              key={term}
              className={`suggestion${i === activeIndex ? " is-active" : ""}`}
              role="option"
              id={`suggestion-${i}`}
              aria-selected={i === activeIndex}
              tabIndex={-1}
              data-index={i}
              style={{ "--i": i }}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => activateItem({ type: "recent", term })}
            >
              <span className="suggestion-recent-icon" aria-hidden="true">
                ↺
              </span>
              <span className="suggestion-text">{term}</span>
              <button
                type="button"
                className="suggestion-remove"
                aria-label={`Remove "${term}" from recent searches`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecent(term);
                }}
              >
                <XCircleFill size={13} />
              </button>
            </div>
          ))}
        </>
      )}

      {showLoadingRow && (
        <div className="suggestions-loading">
          <span className="suggestions-spinner" aria-hidden="true" />
          Searching…
        </div>
      )}

      {!showRecent && videoSuggestions.length > 0 && (
        <>
          <h4>Videos</h4>

          {videoSuggestions.map((video, i) => (
            <div
              key={video.id}
              className={`suggestion${i === activeIndex ? " is-active" : ""}`}
              role="option"
              id={`suggestion-${i}`}
              aria-selected={i === activeIndex}
              tabIndex={-1}
              data-index={i}
              style={{ "--i": i }}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => activateItem({ type: "video", data: video })}
            >
              <img src={video.thumbnail_s} alt="" />
              <h2 className="video-title-s">
                {highlightMatch(video.title, debouncedSearch)}
              </h2>
            </div>
          ))}
        </>
      )}

      {!showRecent && actressSuggestions.length > 0 && (
        <>
          <h4>Actresses</h4>

          {actressSuggestions.map((name, i) => {
            const idx = videoSuggestions.length + i;
            return (
              <div
                key={name}
                className={`suggestion${idx === activeIndex ? " is-active" : ""}`}
                role="option"
                id={`suggestion-${idx}`}
                aria-selected={idx === activeIndex}
                tabIndex={-1}
                data-index={idx}
                style={{ "--i": idx }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => activateItem({ type: "actress", data: name })}
              >
                <PersonCircle /> <span>{highlightMatch(name, debouncedSearch)}</span>
              </div>
            );
          })}
        </>
      )}

      {!showRecent && networkSuggestions.length > 0 && (
        <>
          <h4>Networks</h4>

          {networkSuggestions.map((name, i) => {
            const idx = videoSuggestions.length + actressSuggestions.length + i;
            return (
              <div
                key={name}
                className={`suggestion${idx === activeIndex ? " is-active" : ""}`}
                role="option"
                id={`suggestion-${idx}`}
                aria-selected={idx === activeIndex}
                tabIndex={-1}
                data-index={idx}
                style={{ "--i": idx }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => activateItem({ type: "network", data: name })}
              >
                <CameraReelsFill /> <span>{highlightMatch(name, debouncedSearch)}</span>
              </div>
            );
          })}
        </>
      )}

      {!showRecent && channelSuggestions.length > 0 && (
        <>
          <h4>Channels</h4>

          {channelSuggestions.map((name, i) => {
            const idx =
              videoSuggestions.length +
              actressSuggestions.length +
              networkSuggestions.length +
              i;
            return (
              <div
                key={name}
                className={`suggestion${idx === activeIndex ? " is-active" : ""}`}
                role="option"
                id={`suggestion-${idx}`}
                aria-selected={idx === activeIndex}
                tabIndex={-1}
                data-index={idx}
                style={{ "--i": idx }}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => activateItem({ type: "channel", data: name })}
              >
                <Tv /> <span>{highlightMatch(name, debouncedSearch)}</span>
              </div>
            );
          })}
        </>
      )}

      {showNoResults && (
        <div className="suggestions-empty">
          <span className="suggestions-empty-icon" aria-hidden="true">
            <Search size={18} />
          </span>
          No matches for "{search}"
          <span className="suggestions-empty-hint">Press Enter to search anyway</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Compact form as it normally sits in the nav bar. On small screens
          tapping it opens the full-screen overlay below, rather than
          cramming a live dropdown under a 300px input next to the keyboard. */}
      <div className="search-box" ref={searchRef} onKeyDown={handleKeyDown}>
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            value={search}
            placeholder="Search Video..."
            autoComplete="off"
            role="combobox"
            aria-expanded={dropdownVisible}
            aria-controls="search-listbox"
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            onFocus={() => {
              setIsFocused(true);
              openMobileOverlay();
            }}
            onClick={openMobileOverlay}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search.length > 0 && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={handleClear}
            >
              <XCircleFill size={15} />
            </button>
          )}

          <button
            className={`search-btn${isSubmitting ? " is-submitting" : ""}`}
            onAnimationEnd={() => setIsSubmitting(false)}
            aria-label="Search"
          >
            <Search />
          </button>
        </form>

        {!mobileOpen && dropdownVisible && createPortal(dropdown, document.body)}
      </div>

      {/* Full-screen mobile overlay: opens on tap/focus so the on-screen
          keyboard doesn't fight a tiny anchored dropdown for space. */}
      {mobileOpen &&
        createPortal(
          <div className="search-overlay">
            <div className="search-overlay-bar">
              <button
                type="button"
                className="search-overlay-back"
                aria-label="Close search"
                onClick={() => {
                  setMobileOpen(false);
                  setIsFocused(false);
                  inputRef.current?.blur();
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <form className="search-form search-overlay-form" onSubmit={handleSubmit}>
                <input
                  className="search-input"
                  type="text"
                  value={search}
                  placeholder="Search Video..."
                  autoComplete="off"
                  autoFocus
                  role="combobox"
                  aria-expanded={dropdownVisible}
                  aria-controls="search-listbox"
                  aria-autocomplete="list"
                  aria-activedescendant={activeId}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search.length > 0 && (
                  <button
                    type="button"
                    className="search-clear"
                    aria-label="Clear search"
                    onClick={handleClear}
                  >
                    <XCircleFill size={15} />
                  </button>
                )}
                <button
                  className={`search-btn${isSubmitting ? " is-submitting" : ""}`}
                  onAnimationEnd={() => setIsSubmitting(false)}
                  aria-label="Search"
                >
                  <Search />
                </button>
              </form>
            </div>
            <div className="search-overlay-body">{dropdown}</div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default SearchForm;
