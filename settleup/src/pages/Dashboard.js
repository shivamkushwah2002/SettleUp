import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
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

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-page container" style={{ padding: '20px 12px' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div className="small-muted">Manage your shared expenses</div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/groups/create')}>+ New Group</button>
        </div>
      </div>

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
        <div className="card stat-card">
          <div className="stat-label">Total Balance</div>
          <div className="stat-main" style={{ color: '#059669', fontSize: 22, fontWeight: 700 }}>₹{Number.isFinite(Number(totalBalance)) ? Number(totalBalance).toFixed(2) : '0.00'}</div>
          <div className="small-muted">You are owed</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-main" style={{ fontSize: 22, fontWeight: 700 }}>₹{Number.isFinite(Number(totalExpensesSum)) ? Number(totalExpensesSum).toFixed(2) : '0.00'}</div>
          <div className="small-muted">Across all groups</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Active Groups</div>
          <div className="stat-main" style={{ fontSize: 22, fontWeight: 700 }}>{groups.length}</div>
          <div className="small-muted">Groups you're part of</div>
        </div>
      </div>

      <h3 style={{ marginTop: 0 }}>Your Groups</h3>

      <div className="groups-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
        {groups.length === 0 && <div className="small-muted">No groups yet.</div>}

        {groups.map((g) => (
          <div key={g._id} className="group-card card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0' }}>{g.groupName}</h4>
                <div className="small-muted">{(g.members || []).length} members</div>
              </div>
              <Link to={`/groups/${g._id}`} className="nav-item">→</Link>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="small-muted">Total expenses</div>
              {(() => {
                const tot = Number(g.totalExpenses);
                const display = Number.isFinite(tot) ? tot.toFixed(2) : '0.00';
                return <div style={{ fontWeight: 700 }}>₹{display}</div>;
              })()}
            </div>

            <div style={{ marginTop: 8 }}>
              <div className="small-muted">Your balance</div>
              {(() => {
                const ub = Number(g.userBalance);
                const isFinite = Number.isFinite(ub);
                const color = isFinite && ub < 0 ? '#ef4444' : '#059669';
                const text = isFinite ? (ub > 0 ? `+₹${ub.toFixed(2)}` : `-₹${Math.abs(ub).toFixed(2)}`) : '+₹0.00';
                return <div style={{ fontWeight: 700, color }}>{text}</div>;
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
