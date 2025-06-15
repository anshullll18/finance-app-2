import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

function App() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    type: "expense",
    amount: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const [transRes, statsRes, monthlyRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`),
        axios.get(`${API_URL}/stats`),
        axios.get(`${API_URL}/monthly-stats`),
      ]);
      setTransactions(transRes.data);
      setStats(statsRes.data);
      setMonthlyStats(monthlyRes.data);
      setUser(JSON.parse(localStorage.getItem("user")));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? "login" : "register";
      const res = await axios.post(`${API_URL}/${endpoint}`, formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${res.data.token}`;
      setUser(res.data.user);
      fetchUserData();
      setFormData({ email: "", password: "", name: "" });
    } catch (error) {
      alert(error.response?.data?.error || "Authentication failed");
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/transactions`, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
      });
      fetchUserData();
      setShowForm(false);
      setFormData({
        type: "expense",
        amount: "",
        category: "",
        description: "",
      });
    } catch (error) {
      alert(error.response?.data?.error || "Transaction failed");
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${API_URL}/transactions/${id}`);
      fetchUserData();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setTransactions([]);
    setStats({});
  };

  const pieData = Object.entries(stats.categoryStats || {}).map(
    ([name, value]) => ({ name, value })
  );
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"];

  const handleExportCSV = () => {
    const headers = ["Date", "Type", "Category", "Description", "Amount"];
    const csvData = transactions.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.description,
      t.amount,
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    link.click();
  };

  if (!user) {
    return (
      <div className="auth-container">
        <h1>Personal Finance Tracker</h1>
        <form onSubmit={handleAuth} className="auth-form">
          <h2>{isLogin ? "Login" : "Register"}</h2>
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <button type="submit">{isLogin ? "Login" : "Register"}</button>
          <p onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Register" : "Have an account? Login"}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Finance Tracker</h1>
        <div>
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Balance</h3>
            <p className={stats.balance >= 0 ? "positive" : "negative"}>
              ${stats.balance?.toFixed(2)}
            </p>
          </div>
          <div className="stat-card">
            <h3>Income</h3>
            <p className="positive">${stats.totalIncome?.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Expenses</h3>
            <p className="negative">${stats.totalExpense?.toFixed(2)}</p>
          </div>
        </div>

        <div className="monthly-stats">
          <h2>Monthly Stats</h2>
          <div className="monthly-stats-grid">
            {Object.entries(monthlyStats).map(([month, data]) => (
              <div key={month} className="monthly-stat-card">
                <h3>{month}</h3>
                <p className="positive">Income: ${data.income.toFixed(2)}</p>
                <p className="negative">Expense: ${data.expense.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="charts">
          {pieData.length > 0 && (
            <div className="chart">
              <h3>Spending by Category</h3>
              <PieChart width={400} height={200}>
                <Pie
                  data={pieData}
                  cx={150}
                  cy={100}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          )}
        </div>

        <div className="transactions-section">
          <div className="section-header">
            <h2>Transactions</h2>
            <div>
              <button onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "Add Transaction"}
              </button>
              <button onClick={handleExportCSV} style={{ marginLeft: "10px" }}>
                Export CSV
              </button>
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleTransaction} className="transaction-form">
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <button type="submit">Add Transaction</button>
            </form>
          )}

          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="transaction-item">
                <div>
                  <strong>{transaction.category}</strong>
                  <p>{transaction.description}</p>
                  <small>
                    {new Date(transaction.date).toLocaleDateString()}
                  </small>
                </div>
                <div className="transaction-amount">
                  <span
                    className={
                      transaction.type === "income" ? "positive" : "negative"
                    }
                  >
                    {transaction.type === "income" ? "+" : "-"}$
                    {transaction.amount.toFixed(2)}
                  </span>
                  <button onClick={() => deleteTransaction(transaction._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
