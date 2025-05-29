import React, { useEffect, useRef } from "react";
import BadgeProgressPanel from "./BadgeProgressPanel";

/**
 * SmartLearningModal - React version of the Smart Learning modal.
 * Props:
 *   open: boolean - whether the modal is open
 *   onClose: function - called to close the modal
 *   recommendation: string - the smart learning recommendation text
 */
export default function SmartLearningModal({ open, onClose, recommendation }) {
  const modalRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    function handleKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab" && focusable && focusable.length > 1) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    setTimeout(() => { first?.focus(); }, 0);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Smart Learning"
      data-testid="smart-learning-modal"
      aria-hidden={!open}
      style={{ display: open ? undefined : "none", zIndex: 10001 }}
      ref={modalRef}
    >
      <div className="modal smart-learning-modal" data-testid="smart-learning-modal-content">
        <div className="modal-header">
          <h2>Smart Learning</h2>
          <button className="close-modal" aria-label="Close modal" onClick={onClose} data-testid="close-smart-learning-modal">&times;</button>
        </div>
        <div className="modal-body">
          <p>{recommendation}</p>
          {/* Remove white background and padding from BadgeProgressPanel */}
          <div style={{ background: "none", boxShadow: "none", padding: 0, margin: 0 }}>
            <BadgeProgressPanel />
          </div>
          {/* E2E: Always render badge debug JSON for Smart Learning modal, never null, always array */}
          <pre data-testid="badge-debug-json-smart-learning" style={{ display: 'block', fontSize: 12, color: '#888', marginTop: 16, background: '#f9f9f9', padding: 8, borderRadius: 6, overflowX: 'auto' }}>
            {JSON.stringify((window.appState && Array.isArray(window.appState.badges)) ? window.appState.badges : [])}
          </pre>
        </div>
      </div>
    </div>
  );
}
