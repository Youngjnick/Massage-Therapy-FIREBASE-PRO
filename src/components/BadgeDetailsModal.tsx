import React, { useEffect, useRef } from "react";

export interface Badge {
  id: string;
  name?: string;
  image?: string;
  icon?: string;
  description?: string;
  earned?: boolean;
}

interface BadgeDetailsModalProps {
  open: boolean;
  badge: Badge | null;
  onClose: () => void;
}

export default function BadgeDetailsModal({ open, badge, onClose }: BadgeDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  // Focus trap and Escape key
  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose && onClose();
      } else if (e.key === "Tab" && focusable && focusable.length > 1) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    setTimeout(() => {
      first?.focus();
    }, 0);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Show friendly error/empty state if badge is missing or invalid
  if (!open) return null;
  if (!badge || typeof badge !== "object") {
    return (
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        ref={modalRef}
      >
        <div className="modal-content">
          <h2>Badge not found</h2>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-details-title"
      aria-describedby="badge-details-desc"
      tabIndex={-1}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#000a",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      data-testid="badge-details-modal"
      ref={modalRef}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          minWidth: 320,
          maxWidth: 400,
          boxShadow: "0 4px 32px #0003",
          outline: "none",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close badge details"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            color: "#333",
          }}
          data-testid="badge-details-close"
        >
          ×
        </button>
        <h2 id="badge-details-title" style={{ marginTop: 0, marginBottom: 16 }}>
          {badge.name || badge.id}
        </h2>
        <img
          src={badge.image || badge.icon || "/badges/default.png"}
          alt={badge.name || badge.id}
          style={{
            width: 96,
            height: 96,
            objectFit: "contain",
            borderRadius: 12,
            marginBottom: 16,
          }}
          data-testid="badge-details-img"
        />
        <div
          id="badge-details-desc"
          style={{ marginBottom: 12, color: "#444" }}
        >
          {badge.description || "No description."}
        </div>
        <div
          style={{ fontWeight: 600, color: badge.earned ? "#2ecc40" : "#aaa" }}
          data-testid="badge-details-earned"
        >
          {badge.earned ? "Earned" : "Not earned"}
        </div>
      </div>
    </div>
  );
}
