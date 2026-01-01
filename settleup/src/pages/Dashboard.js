import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import "./style/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [recent, setRecent] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalExpensesSum, setTotalExpensesSum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      setLoading(false);
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const resUser = await axios.get(`http://localhost:5000/api/auth/${storedUser._id}`);
        setUser(resUser.data);

        const resGroups = await axios.get(`http://localhost:5000/api/groups/user/${storedUser._id}`);
        const myGroups = resGroups.data.data || [];

        // For each group, fetch expenses and balances to compute totals and user balance
        const enhanced = await Promise.all(
          myGroups.map(async (g) => {
            const groupCopy = { ...g };
            try {
              const [expRes, balRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/expenses/${g._id}`),
                axios.get(`http://localhost:5000/api/groups/${g._id}/balances`),
              ]);

              const exList = expRes.data.data || [];
              const totalExpenses = exList.reduce((s, it) => s + (Number(it.amount) || 0), 0);

              const balancesObj = balRes.data.success ? (balRes.data.data || {}) : {};
              const uid = storedUser._id;
              const userBal = balancesObj[uid] !== undefined ? Number(balancesObj[uid]) : 0;

              groupCopy.totalExpenses = totalExpenses;
              groupCopy.userBalance = userBal;
              groupCopy._latestExpense = exList.length ? exList.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))[0] : null;
            } catch (err) {
              groupCopy.totalExpenses = 0;
              groupCopy.userBalance = 0;
              groupCopy._latestExpense = null;
            }

            return groupCopy;
          })
        );

        setGroups(enhanced);

        // compute totals
        const tb = enhanced.reduce((s, g) => s + (Number(g.userBalance) || 0), 0);
        const te = enhanced.reduce((s, g) => s + (Number(g.totalExpenses) || 0), 0);
        setTotalBalance(tb);
        setTotalExpensesSum(te);

        // Recent activity: pick up to 4 groups with most recent expense
        const recentResults = enhanced
          .map(g => ({ group: g, expense: g._latestExpense }))
          .filter(r => r.expense)
          .sort((a,b) => new Date(b.expense.createdAt) - new Date(a.expense.createdAt))
          .slice(0,4);

        setRecent(recentResults);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // helper: create a stable gradient from a string (group name)
  const stringToGradient = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 45) % 360;
    return `linear-gradient(180deg, hsl(${h1} 60% 55%), hsl(${h2} 55% 45%))`;
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;
  return (
    <div className="dashboard-page container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="small-muted">Manage your shared expenses</div>
        </div>
      </div>

      <div className="stats-panel card">
        <div className="stats-row">
          <div className="card stat-card">
            <div className="stat-label">Total Balance</div>
            <div className="stat-main stat-emph balance-emph" style={{ color: totalBalance < 0 ? '#ef4444' : '#059669' }}>₹{Number.isFinite(Number(totalBalance)) ? Number(totalBalance).toFixed(2) : '0.00'}</div>
            <div className="small-muted">You are owed</div>
          </div>

          <div className="card stat-card">
            <div className="stat-label">Active Groups</div>
            <div className="stat-main stat-emph">{groups.length}</div>
            <div className="small-muted">Groups you're part of</div>
          </div>

          <div className="card stat-card">
            <div className="stat-label">This Month</div>
            <div className="stat-main stat-emph">₹{Number.isFinite(Number(totalExpensesSum)) ? Number(totalExpensesSum).toFixed(2) : '0.00'}</div>
            <div className="small-muted">Total expenses</div>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="groups-column">
          <div className="panel card groups-panel">
            <div className="panel-header">
              <h3 className="section-title">Your Groups</h3>
              <div className="panel-actions">
                <button className="btn btn-primary btn-icon" onClick={() => navigate('/groups/create')}>
                  <span className="icon"><FiPlus /></span>
                  <span>Create Group</span>
                </button>
              </div>
            </div>

            <div className="groups-list">
              {groups.length === 0 && <div className="small-muted">No groups yet.</div>}

              {groups.map((g) => (
                <div key={g._id} className="group-list-item card">
                  <div className="group-left">
                      { /* Avatar: use image if available, otherwise colored initial */ }
                      {g.avatarUrl || g.image || g.photo ? (
                        <img src={g.avatarUrl || g.image || g.photo} alt={g.groupName} className="group-avatar" onError={(e)=>{e.target.style.display='none'}} />
                      ) : (
                        <div className="group-icon" aria-hidden style={{ background: stringToGradient(g.groupName || 'G') }}>{(g.groupName || 'G')[0]}</div>
                      )}
                    <div>
                      <h4 className="group-title">{g.groupName}</h4>
                      <div className="small-muted">{(g.members || []).length} members • {g._latestExpense ? `Last activity ${new Date(g._latestExpense.createdAt).toLocaleString()}` : 'No recent activity'}</div>
                    </div>
                  </div>

                  <div className="group-right">
                    <div className="small-muted">Your balance</div>
                    {(() => {
                      const ub = Number(g.userBalance);
                      const isFinite = Number.isFinite(ub);
                      const color = isFinite && ub < 0 ? '#ef4444' : '#059669';
                      const text = isFinite ? (ub > 0 ? `+₹${ub.toFixed(2)}` : `-₹${Math.abs(ub).toFixed(2)}`) : '+₹0.00';
                      return <div className="group-balance" style={{ color }}>{text}</div>;
                    })()}
                  </div>

                  <Link to={`/groups/${g._id}`} className="group-link" aria-label={`Open ${g.groupName}`}></Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="activity-column">
          <div className="panel card activity-panel">
            <div className="panel-header">
              <h3 className="section-title">Recent Activity</h3>
            </div>

            <div className="activity-list">
              {recent.length === 0 && <div className="small-muted">No recent activity.</div>}
              {recent.map((r, idx) => {
                const exp = r.expense || {};
                const getActorName = (e) => {
                  if (!e) return 'Someone';
                  const candidates = [
                    e.paidByName,
                    e.payerName,
                    e.paidBy && (e.paidBy.name || e.paidBy.fullName),
                    e.byName,
                    e.by && (e.by.name || e.by.fullName),
                    e.createdBy && (e.createdBy.name || e.createdBy.fullName),
                    e.user && (e.user.name || e.user.fullName),
                    e.author && (e.author.name || e.author.fullName),
                    e.addedByName,
                    e.addedBy && (e.addedBy.name || e.addedBy.fullName),
                    e.username,
                    e.name,
                    e.title,
                  ];
                  for (const c of candidates) {
                    if (c && typeof c === 'string' && c.trim()) return c;
                  }
                  return 'Someone';
                };

                const actor = getActorName(exp);
                const description = exp.title || exp.description || exp.name || exp.note || 'Added an expense';
                const amount = Number(exp.amount) || 0;
                const amountText = amount >= 0 ? `+₹${amount.toFixed(2)}` : `-₹${Math.abs(amount).toFixed(2)}`;

                return (
                  <div key={idx} className="activity-item card">
                    <div className="activity-left">
                      <div className="activity-avatar">{(actor || 'S')[0]}</div>
                      <div>
                        <div className="activity-text"><strong>{actor}</strong> {description} <span className="activity-group">to {r.group.groupName}</span></div>
                        <div className="small-muted">{new Date(exp.createdAt || Date.now()).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={`activity-amount ${amount >= 0 ? 'positive' : 'negative'}`}>{amountText}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

