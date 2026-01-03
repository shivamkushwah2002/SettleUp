// src/pages/groups/CreateGroup.jsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./groups.css";

const CreateGroup = ({ user }) => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/groups/create",
        {
          groupName,
          description,
          createdBy: user._id,  // TEMP
        }
      );

      if (res.data.success) {
        navigate("/groups");
      } else {
        setError(res.data.message || "Failed to create group");
      }
    } catch (err) {
      console.error("CREATE ERROR:", err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-page">
      <h2>Create Group</h2>

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading} className="btn primary">
          {loading ? "Creating..." : "Create Group"}
        </button> &nbsp;

        <button
          type="button"
          className="btn outline"
          onClick={() => navigate("/groups")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreateGroup;
