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
	const [users, setUsers] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [showProfileMenu, setShowProfileMenu] = useState(false);

	const [activeTab, setActiveTab] = useState("expenses");

	const user = JSON.parse(localStorage.getItem("user") || "null");

	const initials = (name) => {
		if (!name) return "?";
		return name
			.split(" ")
			.map((n) => n[0])
			.slice(0, 2)
			.join("")
			.toUpperCase();
	};

	const totalExpensesSum = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
	const outstandingSum = Object.values(balances || {}).reduce((s, v) => s + (v > 0 ? Number(v) : 0), 0);
	const myBalance = Math.round((balances[user?._id] || 0) * 100) / 100;

	// Fetch helpers
	const fetchGroup = async () => {
		try {
			const res = await axios.get(`http://localhost:5000/api/groups/${groupId}`);
			if (res.data.success) setGroup(res.data.data);
		} catch (err) {
			console.log("Error fetching group", err);
		}
	};

	const fetchExpenses = async () => {
		try {
			const res = await axios.get(`http://localhost:5000/api/expenses/${groupId}`);
			if (res.data.success) setExpenses(res.data.data);
		} catch (err) {
			console.log("Expense fetch error:", err);
		}
	};

	const fetchBalances = async () => {
		try {
			const res = await axios.get(`http://localhost:5000/api/groups/${groupId}/balances`);
			if (res.data.success) setBalances(res.data.data);
		} catch (err) {
			console.log("Balance fetch error:", err);
		}
	};

	const fetchPendingSettlements = async () => {
		try {
			if (!user) return;
			const res = await axios.get(`http://localhost:5000/api/settle/pending/${user._id}`);
			if (res.data.success) setPending(res.data.data || []);
		} catch (err) {
			console.log("Pending fetch error:", err);
		}
	};

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			await Promise.all([fetchGroup(), fetchExpenses(), fetchBalances(), fetchPendingSettlements()]);
			setLoading(false);
		};
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupId]);

	// Close profile menu when clicking outside
	useEffect(() => {
		const handleDocClick = () => setShowProfileMenu(false);
		document.addEventListener('click', handleDocClick);
		return () => document.removeEventListener('click', handleDocClick);
	}, []);

	// Search users for add-member
	const searchUsers = async (q) => {
		if (!q || q.trim().length === 0) {
			setUsers([]);
			return;
		}

		try {
			const res = await axios.get(`http://localhost:5000/api/users/search?query=${encodeURIComponent(q)}`);
			if (res.data && res.data.success) setUsers(res.data.data || []);
			else setUsers([]);
		} catch (err) {
			console.log("Search error:", err);
			setUsers([]);
		}
	};

	const handleSearchChange = (e) => {
		const q = e.target.value;
		setSearchQuery(q);
		searchUsers(q);
	};

	const handleAddMember = async (userId) => {
		try {
			const res = await axios.post(`http://localhost:5000/api/groups/${groupId}/add-member?adminId=${user._id}`, { userId });
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

	const handleLogout = () => {
		localStorage.removeItem('user');
		window.location.href = '/login';
	};

	const handleRemoveMember = async (memberId) => {
		if (!window.confirm('Remove this member from group?')) return;
		try {
			const res = await axios.delete(`http://localhost:5000/api/groups/${groupId}/remove-member/${memberId}?adminId=${user._id}`);
			if (res.data.success) {
				window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Member removed!', type: 'success' } }));
				fetchGroup();
			}
		} catch (err) {
			window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: err.response?.data?.message || 'Error removing member', type: 'error' } }));
		}
	};

	const handleConfirm = async (id) => {
		try {
			const res = await axios.post(`http://localhost:5000/api/settle/${id}/confirm`);
			if (res.data.success) {
				fetchPendingSettlements();
				fetchBalances();
				window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Confirmed', type: 'success' } }));
			}
		} catch (err) {
			console.log('Confirm error', err);
		}
	};

	const handleReject = async (id) => {
		try {
			const res = await axios.post(`http://localhost:5000/api/settle/${id}/reject`);
			if (res.data.success) {
				fetchPendingSettlements();
				window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Rejected', type: 'info' } }));
			}
		} catch (err) {
			console.log('Reject error', err);
		}
	};

	const handleSettleUp = async () => {
		if (!selectedReceiver || !settleAmount) return;
		try {
			const res = await axios.post(`http://localhost:5000/api/settle/${groupId}/create`, { from: user._id, to: selectedReceiver, amount: Number(settleAmount) });
			if (res.data.success) {
				window.dispatchEvent(new CustomEvent('app/toast', { detail: { message: 'Settle request sent', type: 'success' } }));
				setShowSettleUp(false);
				fetchBalances();
				fetchPendingSettlements();
			}
		} catch (err) {
			console.log('Settle error', err);
		}
	};

	const addExpense = async () => {
		if (!expDesc || !expAmount) return;
		try {
			const payload = { description: expDesc, amount: Number(expAmount), splitType, exactValues: splitType === 'exact' ? exactValues : undefined, selectedMembers: splitType === 'between' ? selectedMembers : undefined };
			const res = await axios.post(`http://localhost:5000/api/expenses/${groupId}/add`, payload);
			console.log(res.data)
			if (res.data.success) {
				setShowAddExpense(false);
				setExpDesc('');
				setExpAmount('');
				fetchExpenses();
				fetchBalances();
			}
			
		} catch (err) {
			console.log('Add expense error', err);
		}
	};

	if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
	if (!group) return <div style={{ padding: 20 }}>No group found</div>;

	return (
		<div className="gd-wrapper">
			<div className="stats-panel card" style={{ marginBottom: 18 }}>
				<div className="stats-row">
					<div className="stat-card card">
						<div className="stat-label">Total Expenses</div>
						<div className="stat-main stat-emph">₹{totalExpensesSum.toFixed(2)}</div>
						<div className="small-muted">All time</div>
					</div>

					<div className="stat-card card">
						<div className="stat-label">Outstanding</div>
						<div className="stat-main stat-emph">₹{outstandingSum.toFixed(2)}</div>
						<div className="small-muted">Total owed</div>
					</div>

					<div className="stat-card card">
						<div className="stat-label">Your Balance</div>
						<div className="stat-main stat-emph" style={{ color: myBalance < 0 ? '#ef4444' : '#059669' }}>{myBalance >= 0 ? `+₹${myBalance.toFixed(2)}` : `-₹${Math.abs(myBalance).toFixed(2)}`}</div>
						<div className="small-muted">{myBalance < 0 ? 'You owe' : 'You are owed'}</div>
					</div>
				</div>
			</div>

			<div className="gd-header">
				<div>
					<h2 className="gd-title">{group.groupName}</h2>
					<p className="gd-sub">{group.description}</p>
				</div>
				<div className="gd-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<button onClick={() => setShowAddExpense(true)} className="btn btn-primary">+ Expense</button>
					<div style={{ position: 'relative' }}>
						<button
							className="profile-btn"
							onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
							style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
						>
							<div className="avatar" style={{ width: 36, height: 36, borderRadius: 18, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(user?.name)}</div>
						</button>
						{showProfileMenu && (
							<div className="profile-menu card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 80, padding: 12, minWidth: 180 }} onClick={(e) => e.stopPropagation()}>
								<div style={{ marginBottom: 10 }}>
									<strong>{user?.name}</strong>
									<div className="small-muted">{user?.email}</div>
								</div>
								<button className="btn btn-danger" style={{ width: '100%' }} onClick={handleLogout}>Logout</button>
							</div>
						)}
					</div>
				</div>
			</div>

			<div style={{ marginTop: 14 }}>
				<div className="dashboard-tabs">
					<div className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses</div>
					<div className={`tab ${activeTab === 'balances' ? 'active' : ''}`} onClick={() => setActiveTab('balances')}>Balances</div>
					<div className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members</div>
				</div>

				{activeTab === 'expenses' && (
					<div>
						<h3 style={{ margin: 0, marginBottom: 12 }}>Recent Expenses</h3>
						<div className="expenses-container">
							{expenses.length === 0 && <div className="small-muted">No expenses yet.</div>}
							{expenses.map((e) => {
								const isExpanded = expandedExpenseId === e._id;
								const amount = Number(e.amount) || 0;
								let myShare = 0;
								if (e.splitType === 'exact' && e.exactValues) myShare = Number(e.exactValues[user._id] || 0);
								else if (e.splitType === 'between' && e.selectedMembers && e.selectedMembers.length) myShare = e.selectedMembers.includes(user._id) ? amount / e.selectedMembers.length : 0;
								else myShare = amount / (group.members.length || 1);

								return (
									<div key={e._id} className={`expense-item ${isExpanded ? 'expanded' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setExpandedExpenseId(isExpanded ? null : e._id)}>
										<div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
											<div className="activity-avatar" style={{ flex: '0 0 auto' }}>{(e.paidBy?.name || 'S')[0]}</div>
											<div style={{ flex: 1 }}>
												<div className="expense-head"><strong>{e.description}</strong></div>
												<div className="expense-meta small-muted">Paid by {e.paidBy?.name || 'Someone'} • {(e.selectedMembers && e.selectedMembers.length) || group.members.length} people</div>
												<div style={{ marginTop: 8 }}><small className="expense-date small-muted">{new Date(e.createdAt).toLocaleDateString()}</small></div>
											</div>
											<div style={{ flex: '0 0 160px', textAlign: 'right' }}>
												<div className={`activity-amount ${amount >= 0 ? 'positive' : 'negative'}`} style={{ fontWeight: 800, fontSize: 18 }}>₹{amount.toFixed(2)}</div>
												<div className="small-muted">Your share: <span style={{ color: myShare >= 0 ? '#059669' : '#ef4444' }}>{myShare >= 0 ? `+₹${myShare.toFixed(2)}` : `-₹${Math.abs(myShare).toFixed(2)}`}</span></div>
											</div>
										</div>
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

					</div>
				)}

				{activeTab === 'balances' && (
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
						<div className="card balances-card">
							<h3 style={{ marginTop: 0 }}>Member Balances</h3>
							{Object.keys(balances).map((uid) => {
								const member = group.members.find((m) => m._id === uid);
								const name = member ? member.name : uid;
								const amt = Math.round(balances[uid] * 100) / 100;
								return (
									<div key={uid} className="bal-row">
										<div className="small-muted">{name}</div>
										<div className={amt > 0 ? 'balance-positive' : amt < 0 ? 'balance-negative' : ''}>{amt > 0 ? `+₹${amt.toFixed(2)}` : amt < 0 ? `-₹${Math.abs(amt).toFixed(2)}` : '0.00'}</div>
									</div>
								);
							})}
						</div>

						<div className="card">
							{/* <h3 style={{ marginTop: 0 }}>Settlement Summary</h3>
							<div className="settlement-summary-inner">
								<div style={{ marginBottom: 8 }}>To settle all debts:</div>
								<div style={{ fontWeight: 700, marginBottom: 12 }}>{myBalance < 0 ? `You owe ₹${Math.abs(myBalance).toFixed(2)}` : `You are owed ₹${myBalance.toFixed(2)}`}</div>
								<button className="settle-btn" onClick={() => setShowSettleUp(true)}>Settle Up</button> */}

								{/* My Debts moved here from Expenses tab */}
								<div style={{ marginTop: 16 }}>
									<h4 style={{ margin: '6px 0' }}>My Debts</h4>
									{(() => {
										const userBalance = balances[user._id] || 0;
										const roundedBalance = Math.round(userBalance * 100) / 100;
										if (roundedBalance >= 0) return <div style={{ color: '#555' }}>You don't owe anyone. {roundedBalance > 0 ? `You will get back ₹${roundedBalance.toFixed(2)}` : ''}</div>;
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
										if (lines.length === 0) return <div style={{ color: '#555' }}>You don't owe anyone.</div>;
										lines.sort((a, b) => b.amt - a.amt);
										return lines.map((line) => (
											<div key={line.creditorId} className="debt-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
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
							{/* </div> */}
						</div>
					</div>
				)}

				{activeTab === 'members' && (
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
					</div>
				)}
			</div>

			{/* Modals */}
			{showAddExpense && (
				<div className="modal">
					<div className="modal-card">
						<>
							<div className="modal-header">
								<h3 style={{ margin: 0 }}>Add Expense</h3>
								<button onClick={() => setShowAddExpense(false)} className="modal-close">×</button>
							</div>
							<div className="modal-body">
								<input type="text" className="input" value={expDesc} placeholder="Description" onChange={(e) => setExpDesc(e.target.value)} />
								<input type="number" className="input" value={expAmount} placeholder="Amount" onChange={(e) => setExpAmount(e.target.value)} />
								<select value={splitType} onChange={(e) => setSplitType(e.target.value)} className="input">
									<option value="equal">Split Equally</option>
									<option value="exact">Split By Exact Values</option>
									<option value="between">Split Between Selected</option>
								</select>
								{splitType === 'exact' && (
									<div>
										{group.members.map((m) => (
											<div key={m._id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
												<label style={{ flex: 1 }}>{m.name}</label>
												<input type="number" value={exactValues[m._id] || ''} onChange={(e) => setExactValues({ ...exactValues, [m._id]: e.target.value })} className="input" style={{ width: 100, margin: 0 }} />
											</div>
										))}
									</div>
								)}
								{splitType === 'between' && (
									<div>
										<h4 style={{ marginBottom: 10 }}>Select Members:</h4>
										{group.members.map((m) => (
											<label key={m._id} style={{ display: 'block', marginBottom: 10, cursor: 'pointer' }}>
												<input type="checkbox" checked={selectedMembers.includes(m._id)} onChange={() => {
													if (selectedMembers.includes(m._id)) setSelectedMembers(selectedMembers.filter(id => id !== m._id));
													else setSelectedMembers([...selectedMembers, m._id]);
												}} style={{ marginRight: 8 }} />
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
						</>
					</div>
				</div>
			)}

			{showSettleUp && (
				<div className="modal">
					<div className="modal-card">
						<div className="modal-header"><h3>Settle Up</h3></div>
						<div className="modal-body">
							<label>Select Member</label>
							<select value={selectedReceiver} onChange={(e) => setSelectedReceiver(e.target.value)} className="input">
								<option value="">Select</option>
								{Object.keys(balances).filter(uid => balances[uid] > 0).map(uid => {
									const member = group.members.find(m => m._id === uid);
									if (!member) return null;
									return <option key={uid} value={uid}>{member.name} (gets ₹{balances[uid]})</option>;
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

			{showAddMember && (
				<div className="modal">
					<div className="modal-card">
						<div>
							<h3>Add Member to Group</h3>
							<input type="text" className="input" placeholder="Search by name or email..." value={searchQuery} onChange={handleSearchChange} />
							<div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 15 }}>
								{users.length > 0 ? users.map(u => (
									<div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f5f5f5', marginBottom: 8, borderRadius: 5 }}>
										<div><strong>{u.name}</strong><br/><small className="small-muted">{u.email}</small></div>
										<button onClick={() => handleAddMember(u._id)} className="btn btn-accent">Add</button>
									</div>
								)) : searchQuery ? <p className="small-muted">No users found</p> : <p className="small-muted">Search for users to add...</p>}
							</div>
							<button onClick={() => { setShowAddMember(false); setSearchQuery(''); setUsers([]); }} className="btn" style={{ width: '100%', background: '#ccc' }}>Close</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
