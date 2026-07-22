import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./Navbar.css";
import { HouseDoorFill, Gitlab, Bluesky, TencentQq, Backpack4Fill } from "react-bootstrap-icons";
import { Link, NavLink, useLocation } from "react-router-dom";
import hero from "../../assets/logo.png";
import SearchForm from "../searchform/search";
import LogoutButton from "../loguot/loagout";

function Navbar() {
  const role = localStorage.getItem("role");
  const location = useLocation();

  const navListRef = useRef(null);
  const [indicator, setIndicator] = useState({ opacity: 0 });
  // Kept off during the staggered link entrance, then flipped on once it
  // finishes — see the effect below for why.
  const [indicatorSettled, setIndicatorSettled] = useState(false);

  const linkClass = ({ isActive }) => (isActive ? "links active" : "links");

  // Measure the real active link and turn it into the indicator's
  // position/size/radius. Runs against the live DOM so it needs no
  // separate desktop/mobile logic — the same math works whether the
  // links sit in a row (desktop) or a fixed bottom bar (mobile).
  const updateIndicator = () => {
    const list = navListRef.current;
    if (!list) return;

    const activeLink = list.querySelector(".links.active, .links[aria-current='page']");
    if (!activeLink) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const listRect = list.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const borderRadius = window.getComputedStyle(activeLink).borderRadius;

    setIndicator({
      opacity: 1,
      width: `${linkRect.width}px`,
      height: `${linkRect.height}px`,
      borderRadius,
      transform: `translate(${linkRect.left - listRect.left}px, ${
        linkRect.top - listRect.top
      }px)`,
    });
  };

  // Recompute synchronously before paint whenever the route (or the
  // admin-only Menu link) changes, so the pill never flashes in the
  // wrong spot.
  useLayoutEffect(() => {
    updateIndicator();
  }, [location.pathname, role]);

  // Recompute on anything that can move or resize the links without a
  // route change: viewport resize (desktop row <-> mobile tab bar),
  // window load (logo image finishing can shift layout), and any
  // resize of the nav list itself (font swap, content reflow, etc).
  //
  // Also recompute when each link's staggered entrance animation
  // (itemRise) finishes. getBoundingClientRect() reports the element's
  // currently-transformed box, so measuring while a link is still
  // mid-entrance (translateY/scale easing in) locks the indicator onto
  // the wrong position/size. That only shows up on a hard refresh —
  // client-side route changes don't remount the navbar, so there's no
  // entrance animation in flight to race against. Listening for
  // "animationend" on the list (it bubbles up from each <li>) lets the
  // pill self-correct to the true final rect as soon as it's safe to
  // measure, instead of guessing a fixed delay.
  useEffect(() => {
    const raf = requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);
    window.addEventListener("load", updateIndicator);

    const list = navListRef.current;
    const handleEntranceEnd = (e) => {
      if (e.animationName === "itemRise") {
        updateIndicator();
      }
    };
    list?.addEventListener("animationend", handleEntranceEnd);

    let observer;
    if (list && "ResizeObserver" in window) {
      observer = new ResizeObserver(updateIndicator);
      observer.observe(list);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateIndicator);
      window.removeEventListener("load", updateIndicator);
      list?.removeEventListener("animationend", handleEntranceEnd);
      if (observer) observer.disconnect();
    };
  }, []);

  // The animationend-based recompute above makes the indicator's
  // *position* eventually correct, but the very first measurement
  // (in the useLayoutEffect below, right at mount) still happens while
  // the active link is in its entrance animation's "from" state —
  // shrunk and offset — because animation-fill-mode: both holds that
  // state for the whole stagger delay, before the animation even
  // starts. If that first (wrong) rect gets shown immediately, then
  // corrected as later recomputes come in, you see a little flash of
  // the pill in the wrong spot — sometimes appearing to poke slightly
  // outside the link row — right after a refresh, before it settles.
  // Client-side route changes don't remount the navbar, so there's no
  // entrance in flight to be measured mid-flight, which is why this
  // only shows up on a hard refresh.
  //
  // Fix: keep the indicator fully hidden (opacity: 0, no transition)
  // until the entrance has had time to finish, so none of those wrong
  // interim measurements are ever actually shown. Once settled, it
  // fades in already in the correct spot, and the smooth glide comes
  // back for real navigation afterward.
  useEffect(() => {
    // Longest possible entrance: last stagger delay (0.3s) + itemRise's
    // own duration (0.45s), plus a small buffer.
    const timer = setTimeout(() => setIndicatorSettled(true), 850);
    return () => clearTimeout(timer);
  }, []);

  // Cursor-follow glow: track pointer position inside each link as a
  // percentage so the hover glow in Navbar.css can trail the cursor
  // instead of sitting fixed in the center.
  const handleGlowMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };
  const handleGlowLeave = (e) => {
    e.currentTarget.style.setProperty("--mx", "50%");
    e.currentTarget.style.setProperty("--my", "50%");
  };

  return (
    <nav className="site-navbar">
      <div className="nav">
        <div className="nav-logo">
          <Link to="/" className="brand">
            <img src={hero} alt="logo" className="rotate" />
          </Link>
          <SearchForm />
        </div>

        <ul ref={navListRef}>
          <li data-label="Home">
            <NavLink
              to="/"
              end
              className={linkClass}
              onMouseMove={handleGlowMove}
              onMouseLeave={handleGlowLeave}
            >
              <HouseDoorFill />
              <span className="link-label">Home</span>
            </NavLink>
          </li>

          <li data-label="American">
            <NavLink
              to="/american"
              className={linkClass}
              onMouseMove={handleGlowMove}
              onMouseLeave={handleGlowLeave}
            >
              <Bluesky />
              <span className="link-label">American</span>
            </NavLink>
          </li>

          <li data-label="China">
            <NavLink
              to="/china"
              className={linkClass}
              onMouseMove={handleGlowMove}
              onMouseLeave={handleGlowLeave}
            >
              <TencentQq />
              <span className="link-label">China</span>
            </NavLink>
          </li>

          <li data-label="Jav">
            <NavLink
              to="/jav"
              className={linkClass}
              onMouseMove={handleGlowMove}
              onMouseLeave={handleGlowLeave}
            >
              <Gitlab />
              <span className="link-label">Jav</span>
            </NavLink>
          </li>

          {role === "admin" && (
            <li data-label="Menu">
              <NavLink
                to="/menu"
                className={linkClass}
                onMouseMove={handleGlowMove}
                onMouseLeave={handleGlowLeave}
              >
                <Backpack4Fill />
                <span className="link-label">Menu</span>
              </NavLink>
            </li>
          )}

          <li className="logout">
            <LogoutButton />
          </li>

          {/* Sliding indicator — position/size/radius come entirely from
              updateIndicator() above; last child so it never shifts the
              nth-child stagger delays used by the real link entrances. */}
          <li
            className="nav-indicator"
            style={
              indicatorSettled
                ? indicator
                : { ...indicator, opacity: 0, transition: "none" }
            }
            aria-hidden="true"
          />
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
