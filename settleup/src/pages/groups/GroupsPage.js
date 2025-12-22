// src/pages/groups/GroupsPage.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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
            <div className="group-card-left">
              <h3>{g.groupName}</h3>
              <p>{g.description}</p>
            </div>

            <div className="group-card-right">
              <Link to={`/groups/${g._id}`} className="btn outline">
                Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupsPage;
