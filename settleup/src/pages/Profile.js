import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './profile.css';

export default function Profile({ user, setUser, logoutHandler }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', contact: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteToken, setDeleteToken] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', contact: user.contact || '' });
    if (user?.profileImage) setImagePreview(user.profileImage);
  }, [user]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // try multipart upload if file present
      if (imageFile) {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('contact', form.contact);
        fd.append('profileImage', imageFile);
        const res = await axios.put(`http://localhost:5000/api/auth/${user._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const updated = res.data.user || res.data;
        localStorage.setItem('user', JSON.stringify(updated));
        setUser && setUser(updated);
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Profile updated', type: 'success' } }));
      } else {
        // plain JSON update
        const res = await axios.put(`http://localhost:5000/api/auth/${user._id}`, { name: form.name, contact: form.contact });
        const updated = res.data.user || res.data;
        localStorage.setItem('user', JSON.stringify(updated));
        setUser && setUser(updated);
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Profile updated', type: 'success' } }));
      }
    } catch (err) {
      console.error('Profile save error', err);
      // fallback: update localStorage only
      const updated = { ...user, ...form, profileImage: imagePreview || user?.profileImage };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser && setUser(updated);
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Profile saved locally', type: 'info' } }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteToken !== 'DELETE') return;
    if (!user) return;
    try {
      await axios.delete(`http://localhost:5000/api/auth/${user._id}`);
    } catch (err) {
      console.error('Delete error', err);
    }
    // remove local session and redirect
    localStorage.removeItem('user');
    setUser && setUser(null);
    logoutHandler && logoutHandler();
    navigate('/');
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 className="profile-title">Your Profile</h2>
        <div className="profile-grid">
          <div className="profile-form">
            <label className="field-label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <label className="field-label">Email (read-only)</label>
            <input className="input" value={form.email} readOnly />

            <label className="field-label">Contact</label>
            <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />

            <div className="profile-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-ghost" onClick={() => { localStorage.removeItem('user'); logoutHandler && logoutHandler(); navigate('/login'); }}>Logout</button>
            </div>

            <div className="danger-zone">
              <h4>Danger Zone</h4>
              <p className="danger-text">Deleting your account is permanent. All data will be removed.</p>
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
            </div>
          </div>

          <aside className="profile-side">
            <div className="side-title">Profile Picture</div>
            <div className="avatar-preview">
              {imagePreview ? <img src={imagePreview} alt="preview" className="avatar-img" /> : <div className="small-muted">No image</div>}
            </div>
            <input type="file" accept="image/*" onChange={handleFile} className="file-input" />
          </aside>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header"><h3>Confirm Delete Account</h3><button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button></div>
            <div className="modal-body">
              <p className="danger-text">This action is irreversible. To confirm, type <strong>DELETE</strong> below and click the red button.</p>
              <input className="input" value={deleteToken} onChange={(e) => setDeleteToken(e.target.value)} placeholder="Type DELETE to confirm" />
              <div className="modal-actions">
                <button className="btn btn-danger" disabled={deleteToken !== 'DELETE'} onClick={handleDelete}>Permanently Delete</button>
                <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
