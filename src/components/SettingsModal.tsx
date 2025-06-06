import React, { useEffect, useRef } from "react";

/**
 * SettingsModal - React version of the Settings modal.
 * Props:
 *   open: boolean - whether the modal is open
 *   onClose: function - called to close the modal
 *   darkMode: boolean - dark mode enabled
 *   soundEnabled: boolean - sound enabled
 *   onToggleDarkMode: function - toggle dark mode
 *   onToggleSound: function - toggle sound
 *   onSignInOut: function - sign in/out
 *   signedIn: boolean - is user signed in
 *   onDownloadOffline: function - download questions for offline use
 */
export default function SettingsModal({
  open,
  onClose,
  darkMode,
  soundEnabled,
  onToggleDarkMode,
  onToggleSound,
  onSignInOut,
  signedIn,
  onDownloadOffline,
}) {
  const modalRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    console.debug("[SettingsModal] Opened", {
      open,
      darkMode,
      soundEnabled,
      signedIn,
    });
    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    setTimeout(() => {
      first?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", handleKey);
      console.debug("[SettingsModal] Closed");
    };
  }, [open, onClose]);
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      data-testid="settings-modal"
      aria-labelledby="settings-modal-title"
      aria-describedby="settings-modal-desc"
      style={{
        display: open ? undefined : "none",
        zIndex: 10001,
        outline: "2px solid #FFD93D",
      }}
      ref={modalRef}
    >
      <div className="modal settings-modal">
        <div className="modal-header">
          <h2 id="settings-modal-title">Settings</h2>
          <button
            className="close-modal"
            aria-label="Close modal"
            onClick={onClose}
            data-testid="close-settings-modal"
          >
            &times;
          </button>
        </div>
        <div className="modal-body" id="settings-modal-desc">
          <label style={{ display: "block", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={onToggleDarkMode}
            />{" "}
            Dark Mode
          </label>
          <label style={{ display: "block", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={onToggleSound}
            />{" "}
            Sound
          </label>
          <label style={{ display: "block", marginBottom: 8 }}>
            <input type="checkbox" checked={signedIn} onChange={onSignInOut} />{" "}
            Sign In/Sign Out
          </label>
          <button style={{ marginTop: 12 }} onClick={onDownloadOffline}>
            Download Questions for Offline Use
          </button>
        </div>
      </div>
    </div>
  );
}
