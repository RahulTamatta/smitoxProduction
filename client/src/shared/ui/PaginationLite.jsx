import React from "react";
import { Button } from "react-bootstrap";

export default function PaginationLite({ page, perPage, total, disabled, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className="d-flex justify-content-between align-items-center mt-4">
      <div className="d-flex gap-2">
        <Button onClick={() => onChange(page - 1)} disabled={page === 1 || disabled} variant="secondary">
          Previous
        </Button>
        {pages.map((p) => {
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <Button key={p} onClick={() => onChange(p)} variant={page === p ? "primary" : "light"} disabled={disabled}>
                {p}
              </Button>
            );
          }
          if (p === page - 2 || p === page + 2) {
            return (
              <span key={p} className="px-2">…</span>
            );
          }
          return null;
        })}
        <Button onClick={() => onChange(page + 1)} disabled={page === totalPages || disabled} variant="secondary">
          Next
        </Button>
      </div>
      <span className="text-muted">
        Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} orders
      </span>
    </div>
  );
}
