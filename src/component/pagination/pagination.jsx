import { useEffect } from "react";
import "./pagination.css";

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Mobile = 3 page buttons, Desktop = 5 page buttons
  const maxVisiblePages = window.innerWidth <= 768 ? 3 : 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const goToPage = (page) => {
    onPageChange(page);
  };

  useEffect(() => {
  window.scrollTo({ top: 0, behavior: "smooth" });
}, [currentPage]);

  return (
    <div className="pagination">
      {/* First */}
      <button disabled={currentPage === 1} onClick={() => goToPage(1)}>
        «
      </button>

      {/* Previous */}
      <button
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        ‹
      </button>

      {/* Page Numbers */}
      {pages.map((page) => (
        <button
          key={page}
          className={currentPage === page ? "active" : ""}
          disabled={currentPage === page}
          onClick={() => goToPage(page)}
        >
          {page}
        </button>
      ))}

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        ›
      </button>

      {/* Last */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(totalPages)}
      >
        »
      </button>
    </div>
  );
}

export default Pagination;
