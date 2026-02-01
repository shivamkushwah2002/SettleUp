import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const JoinGroup = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        console.log("🔥 JoinGroup loaded");
        console.log("🔥 inviteCode from URL:", inviteCode);
        console.log("🔥 user from localStorage:", user);

        const handleJoin = async () => {
            if (!inviteCode) {
                setError("Invalid invite link.");
                setLoading(false);
                return;
            }

            // User is NOT logged in → save inviteCode → redirect to login
            if (!user) {
                localStorage.setItem("pendingInvite", inviteCode);
                navigate("/login");
                return;
            }

            // User IS logged in → join the group directly
            try {
                const res = await axios.post(
                    `${process.env.REACT_APP_FRONTEND_URL}/api/groups/join-by-code`,
                    { inviteCode, userId: user._id }
                );

                if (res.data.success) {
                    navigate("/groups");
                } else {
                    setError(res.data.message || "Unable to join group.");
                }
            } catch (err) {
                setError("Invite link invalid or expired.");
            } finally {
                setLoading(false);
            }
        };

        handleJoin();
    }, [inviteCode, user, navigate]);

    return (
        <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
            {loading && <h2>Joining group…</h2>}
            {error && <h2 style={{ color: "red" }}>{error}</h2>}
        </div>
    );
};

export default JoinGroup;
