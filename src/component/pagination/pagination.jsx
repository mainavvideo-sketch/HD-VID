import "./pagination.css";

function Pagination({ currentPage, totalPages, onPageChange }) {
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

  return (
    <div className="pagination">
      <button disabled={currentPage === 1} onClick={() => onPageChange(1)}>
        «
      </button>

      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ‹
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)}>1</button>
          {startPage > 2 && <span className="ellipsis">…</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          className={currentPage === page ? "active" : ""}
          disabled={currentPage === page}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="ellipsis">…</span>}
          <button onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        ›
      </button>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        »
      </button>
    </div>
  );
}

export default Pagination;