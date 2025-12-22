import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./groupDetails.css";

export default function GroupDetails() {
  const { groupId } = useParams();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [pending, setPending] = useState([]);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const [splitType, setSplitType] = useState("equal");
  const [exactValues, setExactValues] = useState({});
  const [selectedMembers, setSelectedMembers] = useState([]);

  const [showSettleUp, setShowSettleUp] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  // UI toggle: hide aggregated net balances by default to show raw pairwise debts
  // Show net balances by default for clearer summary
  const showAggregatedBalances = true;

  const initials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // -----------------------------
  // FETCH GROUP
  // -----------------------------
  const fetchGroup = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/groups/${groupId}`);
      if (res.data.success) {
        setGroup(res.data.data);
      }
    } catch (err) {
      setError("Error fetching group");
    }
    setLoading(false);
  };

  // -----------------------------
  // FETCH EXPENSES
  // -----------------------------
  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/expenses/${groupId}`);
      if (res.data.success) setExpenses(res.data.data);
    } catch (err) {
      console.log("Expense fetch error:", err);
    }
  };

  // -----------------------------
  // FETCH BALANCES
  // -----------------------------
  const fetchBalances = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/groups/${groupId}/balances`
      );
      if (res.data.success) {
        setBalances(res.data.data);
      }
    } catch (err) {
      console.log("Balance fetch error:", err);
    }
  };

  // -----------------------------
  // FETCH PENDING SETTLEMENTS
  // -----------------------------
  const fetchPendingSettlements = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/settle/pending/${user._id}`
      );
      if (res.data.success) setPending(res.data.data);
    } catch (err) {
      console.log("Pending settlement fetch error:", err);
    }
  };

  // -----------------------------
  // INIT LOAD
  // -----------------------------
  useEffect(() => {
    fetchGroup();
    fetchExpenses();
    fetchBalances();
    fetchPendingSettlements();
  }, [groupId]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!group) return <div>No group found</div>;
  if (!user) return <div style={{ padding: 20 }}>Please log in first</div>;

  // -----------------------------
  // ADD EXPENSE
  // -----------------------------
  const addExpense = async () => {
    if (!expDesc || !expAmount) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Description & Amount required', type: 'error' } }));
      return;
    }

    if (splitType === "exact") {
      const total = Object.values(exactValues).reduce(
        (a, b) => a + Number(b || 0),
        0
      );
      if (total !== Number(expAmount))
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Exact amounts must match total', type: 'error' } }));
        return;
    }

    if (splitType === "between" && selectedMembers.length === 0) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Select at least one member', type: 'error' } }));
      return;
    }

    try {
      const payload = {
        description: expDesc,
        amount: Number(expAmount),
        paidBy: user._id,
        splitType,
        exactValues,
        selectedMembers,
      };

      const res = await axios.post(
        `http://localhost:5000/api/expenses/${groupId}/add`,
        payload
      );

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Expense added!', type: 'success' } }));

        setShowAddExpense(false);
        setExpDesc("");
        setExpAmount("");
        setExactValues({});
        setSelectedMembers([]);
        setSplitType("equal");

        fetchExpenses();
        fetchBalances();
        fetchGroup();
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Error adding expense', type: 'error' } }));
    }
  };

  // -----------------------------
  // SEND SETTLE REQUEST
  // -----------------------------
  const handleSettleUp = async () => {
    if (!selectedReceiver) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Choose user', type: 'error' } }));
      return;
    }
    if (!settleAmount) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Enter amount', type: 'error' } }));
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/settle/${groupId}/create`,
        {
          payerId: user._id,
          receiverId: selectedReceiver,
          amount: Number(settleAmount),
        }
      );

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Settlement request sent!', type: 'success' } }));

        setShowSettleUp(false);
        setSelectedReceiver("");
        setSettleAmount("");

        // Refresh balances and group data after settlement
        fetchBalances();
        fetchGroup();
        fetchPendingSettlements();
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Error creating settlement', type: 'error' } }));
    }
  };

  // -----------------------------
  // CONFIRM SETTLEMENT
  // -----------------------------
  const handleConfirm = async (id) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/settle/${id}/confirm`
      );

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Settlement confirmed!', type: 'success' } }));

        if (res.data.balances) {
          setBalances(res.data.balances);
        }

        // Refresh all data after settlement
        fetchBalances();
        fetchGroup();
        fetchPendingSettlements();
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Error confirming', type: 'error' } }));
    }
  };

  // -----------------------------
  // REJECT SETTLEMENT
  // -----------------------------
  const handleReject = async (id) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/settle/${id}/reject`
      );

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Rejected', type: 'success' } }));
        fetchPendingSettlements();
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Error rejecting', type: 'error' } }));
    }
  };

  // -----------------------------
  // SEARCH USERS
  // -----------------------------
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/search?query=${query}`
      );
      if (res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.log("Search error:", err);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
    console.log("Searching for:", query);
  };

  // -----------------------------
  // ADD MEMBER
  // -----------------------------
  const handleAddMember = async (userId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/groups/${groupId}/add-member?adminId=${user._id}`,
        { userId }
      );

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Member added!', type: 'success' } }));
        setShowAddMember(false);
        setSearchQuery("");
        setUsers([]);
        fetchGroup();
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: err.response?.data?.message || 'Error adding member', type: 'error' } }));
    }
  };

  // -----------------------------
  // REMOVE MEMBER
  // -----------------------------
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member from group?")) return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/groups/${groupId}/remove-member/${memberId}?adminId=${user._id}`
      );

      if (res.data.success) {
        window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Member removed!', type: 'success' } }));
        fetchGroup();
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: err.response?.data?.message || 'Error removing member', type: 'error' } }));
    }
  }

  // -------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------
  return (
    <div className="gd-wrapper">
      <div className="gd-header">
        <div>
          <h2 className="gd-title">{group.groupName}</h2>
          <p className="gd-sub">{group.description}</p>
        </div>

        <div className="gd-actions">
          <button onClick={() => setShowAddExpense(true)} className="btn btn-primary">+ Expense</button>
        </div>
      </div>

      <div className="gd-grid" style={{ marginTop: 14 }}>
        {/* LEFT COLUMN */}
        <div>
          <div className="card members-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Members ({group.members.length})</h3>
              {group.createdBy._id === user._id && (
                <button onClick={() => setShowAddMember(true)} className="btn btn-accent">+ Add</button>
              )}
            </div>

            <div>
              {group.members.map((member) => (
                <div key={member._id} className="member-item">
                  <div className="member-left">
                    <div className="avatar">{initials(member.name)}</div>
                    <div>
                      <strong>{member.name}</strong>
                      <br />
                      <small className="small-muted">{member.email}</small>
                    </div>
                  </div>
                  {group.createdBy._id === user._id && group.createdBy._id !== member._id && (
                    <button onClick={() => handleRemoveMember(member._id)} className="btn btn-danger">Remove</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showAggregatedBalances && (
            <div className="card balances-card">
              <h4 style={{ marginTop: 0 }}>Net Balances</h4>
              {Object.keys(balances).map((uid) => {
                const member = group.members.find((m) => m._id === uid);
                const name = member ? member.name : uid;
                const amt = Math.round(balances[uid] * 100) / 100;

                return (
                  <div key={uid} className="bal-row">
                    <div className="small-muted">{name}</div>
                    <div className={amt > 0 ? 'balance-positive' : amt < 0 ? 'balance-negative' : ''}>{amt > 0 ? `gets ₹${amt.toFixed(2)}` : amt < 0 ? `owes ₹${Math.abs(amt).toFixed(2)}` : 'settled'}</div>
                  </div>
                );
              })}
            </div>
          )}

          {pending.length > 0 && (
            <div className="card pending-card">
              <h4 style={{ marginTop: 0 }}>Pending</h4>
              {pending.map((p) => (
                <div key={p._id} className="pending-item">
                  <div style={{ marginBottom: 8 }}><strong>{p.payerId?.name}</strong> paid ₹{p.amount}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleConfirm(p._id)} className="btn btn-success">Confirm</button>
                    <button onClick={() => handleReject(p._id)} className="btn btn-danger">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <h3 style={{ margin: 0, marginBottom: 12 }}>Expenses</h3>


          <div className="expenses-container">
            {expenses.length === 0 && <div className="small-muted">No expenses yet.</div>}

            {expenses.map((e) => {
              const isExpanded = expandedExpenseId === e._id;
              return (
                <div key={e._id} className={`expense-item ${isExpanded ? 'expanded' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setExpandedExpenseId(isExpanded ? null : e._id)}>
                  <div className="expense-head">
                    <strong>{e.description}</strong>
                    <div className="balance-positive">₹{e.amount}</div>
                  </div>
                  <div className="expense-meta">Paid by: {e.paidBy?.name}</div>
                  <small className="expense-date">{new Date(e.createdAt).toLocaleString()}</small>

                  {isExpanded && (
                    <div className="expense-details">
                      <div><strong>Split Type:</strong> {e.splitType || 'equal'}</div>
                      <div><strong>Split Between:</strong></div>
                      <ul>
                        {e.splitType === 'exact' && e.exactValues && Object.entries(e.exactValues).map(([uid, val]) => {
                          const member = group.members.find(m => m._id === uid);
                          return <li key={uid}>{member ? member.name : uid}: ₹{val}</li>;
                        })}
                        {e.splitType === 'between' && e.selectedMembers && e.selectedMembers.map(uid => {
                          const member = group.members.find(m => m._id === uid);
                          return <li key={uid}>{member ? member.name : uid}</li>;
                        })}
                        {(!e.splitType || e.splitType === 'equal') && group.members.map(m => (
                          <li key={m._id}>{m.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <h3 style={{ marginTop: 18 }}>My Debts</h3>

          {(() => {
            // Use aggregated balances from backend
            // balances[userId] > 0 means user gets money (credit)
            // balances[userId] < 0 means user owes money (debit)
            
            const userBalance = balances[user._id] || 0;
            const roundedBalance = Math.round(userBalance * 100) / 100;

            if (roundedBalance >= 0) {
              // User doesn't owe anyone or is settled
              return <div style={{ color: '#555' }}>You don't owe anyone. {roundedBalance > 0 ? `You will get back ₹${roundedBalance.toFixed(2)}` : ''}</div>;
            }

            // User owes money (negative balance)
            // We need to show who user owes and how much
            // Get the pairwise debts where user is the debtor
            const pairwise = group.pairwise || {};
            const pw = typeof pairwise === 'object' ? pairwise : {};
            const userDebtors = pw[user._id] || {};

            const lines = [];
            for (const creditorId of Object.keys(userDebtors)) {
              const amt = Number(userDebtors[creditorId] || 0);
              if (amt > 0) {
                const creditor = group.members.find((m) => m._id === creditorId);
                const roundedAmt = Math.round(amt * 100) / 100;
                lines.push({ creditorId, creditorName: creditor ? creditor.name : creditorId, amt: roundedAmt });
              }
            }

            if (lines.length === 0) {
              return <div style={{ color: '#555' }}>You don't owe anyone.</div>;
            }

            lines.sort((a, b) => b.amt - a.amt);

            return lines.map((line) => (
              <div key={line.creditorId} className="debt-line">
                <div>
                  <strong>You</strong> <span style={{ color: '#d9534f' }}>owe</span> <strong>{line.creditorName}</strong>
                  <div className="balance-negative">₹{line.amt.toFixed(2)}</div>
                </div>
                <div>
                  <button onClick={() => { setSelectedReceiver(line.creditorId); setSettleAmount(line.amt); setShowSettleUp(true); }} className="btn btn-primary">Settle</button>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ---------------- ADD EXPENSE MODAL ---------------- */}
      {showAddExpense && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Add Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <input type="text" className="input" value={expDesc} placeholder="Description" onChange={(e) => setExpDesc(e.target.value)} />

              <input type="number" className="input" value={expAmount} placeholder="Amount" onChange={(e) => setExpAmount(e.target.value)} />

              {/* SPLIT TYPE */}
              <select value={splitType} onChange={(e) => setSplitType(e.target.value)} className="input">
                <option value="equal">Split Equally</option>
                <option value="exact">Split By Exact Values</option>
                <option value="between">Split Between Selected</option>
              </select>

              {/* EXACT INPUTS */}
              {splitType === "exact" && (
                <div>
                  {group.members.map((m) => (
                    <div key={m._id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <label style={{ flex: 1 }}>{m.name}</label>
                      <input type="number" value={exactValues[m._id] || ""} onChange={(e) => setExactValues({ ...exactValues, [m._id]: e.target.value })} className="input" style={{ width: 100, margin: 0 }} />
                    </div>
                  ))}
                </div>
              )}

              {/* BETWEEN INPUTS */}
              {splitType === "between" && (
                <div>
                  <h4 style={{ marginBottom: 10 }}>Select Members:</h4>
                  {group.members.map((m) => (
                    <label
                      key={m._id}
                      style={{ display: "block", marginBottom: 10, cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(m._id)}
                        onChange={() => {
                          if (selectedMembers.includes(m._id)) {
                            setSelectedMembers(
                              selectedMembers.filter((id) => id !== m._id)
                            );
                          } else {
                            setSelectedMembers([...selectedMembers, m._id]);
                          }
                        }}
                        style={{ marginRight: 8, cursor: 'pointer' }}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={addExpense} className="btn btn-primary">Save Expense</button>
              <button onClick={() => setShowAddExpense(false)} className="btn" style={{ background: '#ccc', color: '#000' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SETTLE UP MODAL ---------------- */}
      {showSettleUp && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Settle Up</h3>
            </div>

            <div className="modal-body">
              <label>Select Member</label>
              <select value={selectedReceiver} onChange={(e) => setSelectedReceiver(e.target.value)} className="input">
                <option value="">Select</option>

                {Object.keys(balances)
                  .filter((uid) => balances[uid] > 0)
                  .map((uid) => {
                    const member = group.members.find((m) => m._id === uid);
                    if (!member) return null;

                    return (
                      <option key={uid} value={uid}>
                        {member.name} (gets ₹{balances[uid]})
                      </option>
                    );
                  })}
              </select>

              <input type="number" className="input" placeholder="Amount" value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)} />

              <div>
                <button onClick={handleSettleUp} className="btn btn-primary" style={{ marginRight: 10 }}>Send Request</button>
                <button onClick={() => setShowSettleUp(false)} className="btn" style={{ background: '#ccc' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* ---------------- ADD MEMBER MODAL ---------------- */}
          {showAddMember && (
            <div className="modal">
              <div className="modal-card">
                <h3>Add Member to Group</h3>

                <input type="text" className="input" placeholder="Search by name or email..." value={searchQuery} onChange={handleSearchChange} />

                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 15 }}>
                  {users.length > 0 ? (
                    users.map((u) => (
                      <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f5f5f5', marginBottom: 8, borderRadius: 5 }}>
                        <div>
                          <strong>{u.name}</strong>
                          <br />
                          <small className="small-muted">{u.email}</small>
                        </div>
                        <button onClick={() => handleAddMember(u._id)} className="btn btn-accent">Add</button>
                      </div>
                    ))
                  ) : searchQuery ? (
                    <p className="small-muted">No users found</p>
                  ) : (
                    <p className="small-muted">Search for users to add...</p>
                  )}
                </div>

                <button onClick={() => { setShowAddMember(false); setSearchQuery(''); setUsers([]); }} className="btn" style={{ width: '100%', background: '#ccc' }}>Close</button>
              </div>
            </div>
          )}
        </div>
      );
}
