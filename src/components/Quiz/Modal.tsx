import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, className = '', style = {} }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      overlayRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      data-testid="modal-overlay"
      className={`modal-summary${className ? ' ' + className : ''}`}
      style={{
        position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, ...style
      }}
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, padding: 32, minWidth: 320,
          maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 32, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b' }} aria-label="Close Modal">&times;</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
