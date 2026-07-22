import { useEffect, useState } from "react";
import "./Footer.css";
import { ArrowUpCircleFill } from "react-bootstrap-icons";

function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={`back-to-top ${showTop ? "visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <ArrowUpCircleFill />
    </button>
  );
}

export default Footer;
