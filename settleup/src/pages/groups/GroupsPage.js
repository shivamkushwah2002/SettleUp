// src/pages/groups/GroupsPage.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FiUsers, FiDollarSign, FiExternalLink, FiUserPlus } from "react-icons/fi";
import "./groups.css";

// TEMP: hardcoded user ID for debugging


const GroupsPage = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // guard: if no logged-in user, avoid calling API with undefined id
    if (!user || !user._id) {
      setError("Please log in to view your groups");
      setGroups([]);
      return;
    }

    const fetchGroups = async () => {
      setLoading(true);
      setError(null);

      try {

        const res = await axios.get(
          `http://localhost:5000/api/groups/user/${user._id}`
        );

        setGroups(res.data.data || []);
        console.log("GROUPS FETCHED:", res.data.data);
      } catch (err) {
        console.error("GROUP LOAD ERROR:", err);
        setError("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return (
    <div className="groups-page container">
      <div className="groups-header">
        <h2>Your Groups</h2>

        <button className="btn primary" onClick={() => navigate("/groups/create")}>
          Create Group
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="groups-list">
        {!loading && groups.length === 0 && (
          <p>No groups yet. Create one!</p>
        )}

        {groups.map((g) => (
          <div key={g._id} className="group-card">
            <div className="group-card-inner">
              <div className="group-card-left" style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                { (g.avatarUrl || g.image || g.photo) ? (
                  <img src={g.avatarUrl || g.image || g.photo} alt={g.groupName} className="group-avatar" onError={(e)=>{e.target.style.display='none'}} />
                ) : (
                  <div className="group-icon">{(g.groupName || 'G')[0]}</div>
                )}
                <div>
                  <h3>{g.groupName}</h3>
                  <p className="group-description">{g.description}</p>
                </div>
              </div>

              <div className="group-footer">
                <div className="group-stats">
                  <span className="stat"><FiUsers /> {(g.members || []).length}</span>
                  <span className="stat"><FiDollarSign /> {g.userBalance ? (g.userBalance > 0 ? `+₹${Number(g.userBalance).toFixed(2)}` : `-₹${Math.abs(Number(g.userBalance)).toFixed(2)}`) : '₹0.00'}</span>
                </div>

                <div className="card-actions" aria-hidden>
                  <Link to={`/groups/${g._id}`} className="btn outline"><FiExternalLink /></Link>
                  <button className="btn outline" onClick={() => navigate(`/groups/${g._id}`)}><FiUserPlus /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;
