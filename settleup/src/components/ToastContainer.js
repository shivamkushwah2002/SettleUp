import React, { useEffect, useRef, useState } from 'react';
import '../index.css';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const ANIM_MS = 280; // match CSS animation duration

  useEffect(() => {
    const handler = (e) => {
      const { message, type = 'info', duration = 4000 } = e.detail || {};
      const id = Date.now() + Math.random();
      const toast = { id, message, type, exiting: false };
      setToasts((t) => [...t, toast]);

      // schedule auto-remove which triggers exit animation first
      const timeout = setTimeout(() => {
        startRemove(id);
      }, duration);

      timers.current.set(id, timeout);
    };

    window.addEventListener('app/toast', handler);
    return () => window.removeEventListener('app/toast', handler);
  }, []);

  const startRemove = (id) => {
    // clear any existing auto timeout
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }

    // mark as exiting to play exit animation
    setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, exiting: true } : x)));

    // remove after animation
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      timers.current.delete(id);
    }, ANIM_MS);

    timers.current.set(id, removeTimer);
  };

  const handleClose = (id) => {
    startRemove(id);
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type} ${toast.exiting ? 'exit' : 'enter'}`}>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close" onClick={() => handleClose(toast.id)} aria-label="Close">×</button>
        </div>
      ))}
    </div>
  );
}
