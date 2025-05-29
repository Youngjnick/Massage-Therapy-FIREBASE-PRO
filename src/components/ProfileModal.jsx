import React, { useEffect, useRef } from "react";

/**
 * ProfileModal - React version of the Profile modal.
 * Props:
 *   open: boolean - whether the modal is open
 *   onClose: function - called to close the modal
 *   user: object - user info (avatar, displayName, email)
 *   darkMode: boolean - dark mode enabled
 *   soundEnabled: boolean - sound enabled
 *   onToggleDarkMode: function - toggle dark mode
 *   onToggleSound: function - toggle sound
 *   onSignInOut: function - sign in/out
 *   signedIn: boolean - is user signed in
 *   onOpenSettings: function - open settings modal
 *   onOpenSmartLearning: function - open smart learning modal
 *   onOpenAnalytics: function - open analytics modal
 */
export default function ProfileModal({
  open,
  onClose,
  user = {},
  darkMode,
  soundEnabled,
  onToggleDarkMode,
  onToggleSound,
  onSignInOut,
  signedIn,
  onOpenSettings,
  onOpenSmartLearning,
  onOpenAnalytics,
}) {
  const modalRef = useRef(null);
  // Always render in DOM, hide with display:none and aria-hidden
  useEffect(() => {
    if (!open) return;
    // Focus trap
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
    // Focus first element
    setTimeout(() => { first?.focus(); }, 0);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);
  const avatarUrl = user.photoURL || "/default-avatar.png";
  const displayName = user.displayName || "Guest";
  const email = user.email || "";
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
      data-testid="profile-modal"
      aria-hidden={!open}
      style={{ display: open ? undefined : "none", zIndex: 10001 }}
      ref={modalRef}
    >
      <div className="modal profile-modal" data-testid="profile-modal-content">
        <div className="modal-header">
          <h2>Profile</h2>
          <button className="close-modal" aria-label="Close modal" onClick={onClose} data-testid="close-profile-modal">&times;</button>
        </div>
        <div className="modal-body">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginBottom:12}}>
            <img src={avatarUrl} alt="User Avatar" style={{width:64,height:64,borderRadius:'50%',objectFit:'cover',boxShadow:'0 1px 4px #0002'}} onError={e => {e.target.src='/default-avatar.png';}} />
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',fontSize:'0.97em'}}>
              <div style={{fontWeight:'bold'}}>{displayName}</div>
              {email && <div style={{color:'#888'}}>{email}</div>}
            </div>
          </div>
          <div style={{display:'flex',gap:4,alignItems:'center',justifyContent:'center',marginBottom:8,flexWrap:'wrap'}}>
            <label style={{marginBottom:0}}>
              <input type="checkbox" checked={darkMode} onChange={onToggleDarkMode} /> Dark Mode
            </label>
            <label style={{marginBottom:0}}>
              <input type="checkbox" checked={soundEnabled} onChange={onToggleSound} /> Sound
            </label>
          </div>
          <div style={{marginTop:18}}>
            <label data-testid="sign-in-out-label">
              <input type="checkbox" checked={signedIn} onChange={onSignInOut} data-testid="sign-in-out-checkbox" /> Sign In/Sign Out
            </label>
          </div>
          <button id="smartLearningBtn" data-testid="smart-learning-btn" style={{display:'flex',alignItems:'center',marginBottom:8}} onClick={onOpenSmartLearning}>
            <svg fill="white" height="16" viewBox="0 0 24 24" width="16" style={{verticalAlign:'middle',marginRight:4}}>
              <path d="M20.3 5.7a1 1 0 00-1.4-1.4L9 14.17l-3.9-3.9a1 1 0 10-1.4 1.42l4.6 4.6a1 1 0 001.4 0l11-11z"></path>
            </svg>
            Smart Learning
          </button>
          <button id="analyticsBtn" data-testid="analytics-btn" aria-label="Analytics" style={{display:'flex',alignItems:'center',marginBottom:8}} onClick={onOpenAnalytics}>
            <svg fill="white" height="16" viewBox="0 0 24 24" width="16" style={{verticalAlign:'middle',marginRight:4}}>
              <path d="M3 17h2v-7H3v7zm4 0h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-2h-2v2zm4 0h2v-10h-2v10z"></path>
            </svg>
            Analytics
          </button>
          <button id="openSettingsBtn" data-testid="settings-btn" style={{display:'flex',alignItems:'center',marginTop:18}} onClick={onOpenSettings}>
            <svg fill="white" height="16" viewBox="0 0 24 24" width="16" style={{verticalAlign:'middle',marginRight:4}}>
              <path d="M19.14,12.94a1.43,1.43,0,0,0,0-1.88l2-1.55a.5.5,0,0,0,.12-.66l-2-3.46a.5.5,0,0,0-.61-.22l-2.35,1a5.37,5.37,0,0,0-1.62-.94l-.36-2.49A.5.5,0,0,0,13,3H11a.5.5,0,0,0-.5.42l-.36,2.49a5.37,5.37,0,0,0-1.62.94l-2.35-1a.5.5,0,0,0-.61.22l-2,3.46a.5.5,0,0,0,.12.66l2,1.55a1.43,1.43,0,0,0,0,1.88l-2,1.55a.5.5,0,0,0-.12.66l2,3.46a.5.5,0,0,0,.61.22l2.35-1a5.37,5.37,0,0,0,1.62.94l.36,2.49A.5.5,0,0,0,11,21h2a.5.5,0,0,0,.5-.42l.36-2.49a5.37,5.37,0,0,0,1.62-.94l2.35,1a.5.5,0,0,0,.61-.22l2-3.46a.5.5,0,0,0-.12-.66ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"></path>
            </svg>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
