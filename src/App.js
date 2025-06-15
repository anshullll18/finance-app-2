// App.js
import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Target, LogOut, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar ,Pie } from 'recharts';
import './App.css';

const PersonalFinanceTracker = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Mock users database (in real app, this would be handled by backend)
  const [users, setUsers] = useState([
    { id: 1, name: 'Demo User', email: 'demo@example.com', password: 'demo123' }
  ]);

  // App state - starts empty
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('all');

  const categories = {
    expense: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other']
  };

  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      loadUserData(user.id);
    }
  }, []);

  // Save user data to localStorage whenever data changes
  useEffect(() => {
    if (currentUser) {
      saveUserData();
    }
  }, [transactions, budgets, currentUser]);

  const saveUserData = () => {
    if (currentUser) {
      const userData = {
        transactions,
        budgets
      };
      localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
    }
  };

  const loadUserData = (userId) => {
    const savedData = localStorage.getItem(`userData_${userId}`);
    if (savedData) {
      const { transactions: savedTransactions, budgets: savedBudgets } = JSON.parse(savedData);
      setTransactions(savedTransactions || []);
      setBudgets(savedBudgets || []);
    } else {
      // Initialize empty data for new user
      setTransactions([]);
      setBudgets([]);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(user));
      loadUserData(user.id);
      setLoginData({ email: '', password: '' });
    } else {
      alert('Invalid email or password');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (users.find(u => u.email === registerData.email)) {
      alert('User already exists with this email');
      return;
    }

    const newUser = {
      id: users.length + 1,
      name: registerData.name,
      email: registerData.email,
      password: registerData.password
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    loadUserData(newUser.id);
    setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
    setIsRegistering(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTransactions([]);
    setBudgets([]);
    localStorage.removeItem('currentUser');
    setActiveTab('dashboard');
  };

  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.description) return;
    
    const transaction = {
      id: Date.now(),
      ...newTransaction,
      amount: parseFloat(newTransaction.amount)
    };
    
    setTransactions([transaction, ...transactions]);
    
    if (transaction.type === 'expense') {
      setBudgets(budgets.map(budget => 
        budget.category === transaction.category 
          ? { ...budget, spent: budget.spent + transaction.amount }
          : budget
      ));
    }
    
    setNewTransaction({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const addBudget = (category, limit) => {
    const existingBudget = budgets.find(b => b.category === category);
    if (existingBudget) {
      setBudgets(budgets.map(b => 
        b.category === category ? { ...b, limit } : b
      ));
    } else {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      setBudgets([...budgets, { category, limit, spent }]);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' || t.type === filterType
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const monthlyData = transactions.reduce((acc, transaction) => {
    const month = transaction.date.slice(0, 7);
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
    acc[month][transaction.type === 'income' ? 'income' : 'expenses'] += transaction.amount;
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff'];

  // Authentication forms
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <DollarSign size={32} className="logo-icon" />
            <h1>FinanceTracker</h1>
          </div>
          
          {!isRegistering ? (
            <form onSubmit={handleLogin} className="auth-form">
              <h2>Login</h2>
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
              />
              <button type="submit" className="auth-button">Login</button>
              <p className="auth-switch">
                Don't have an account? 
                <button type="button" onClick={() => setIsRegistering(true)} className="switch-button">
                  Register here
                </button>
              </p>
              <div className="demo-credentials">
                <p><strong>Demo Account:</strong></p>
                <p>Email: demo@example.com</p>
                <p>Password: demo123</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <h2>Register</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                required
              />
              <button type="submit" className="auth-button">Register</button>
              <p className="auth-switch">
                Already have an account? 
                <button type="button" onClick={() => setIsRegistering(false)} className="switch-button">
                  Login here
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <DollarSign size={32} className="logo-icon" />
            <h1>FinanceTracker</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <User size={20} />
              <span>Welcome, {currentUser.name}</span>
            </div>
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
        <nav className="nav">
          {['dashboard', 'transactions', 'budget', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-button ${activeTab === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="summary-cards">
              <div className="card income-card">
                <TrendingUp size={32} />
                <div>
                  <p>Total Income</p>
                  <h2>${totalIncome.toFixed(2)}</h2>
                </div>
              </div>
              <div className="card expense-card">
                <TrendingDown size={32} />
                <div>
                  <p>Total Expenses</p>
                  <h2>${totalExpenses.toFixed(2)}</h2>
                </div>
              </div>
              <div className="card balance-card">
                <DollarSign size={32} />
                <div>
                  <p>Balance</p>
                  <h2 className={balance >= 0 ? 'positive' : 'negative'}>
                    ${balance.toFixed(2)}
                  </h2>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Quick Add Transaction</h3>
              <div className="transaction-form">
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value, category: ''})}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                />
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories[newTransaction.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                />
                <button onClick={addTransaction} className="add-button">
                  <PlusCircle size={16} />
                  Add
                </button>
              </div>
            </div>

            {transactions.length > 0 && (
              <div className="card">
                <h3>Recent Transactions</h3>
                <div className="transactions-list">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-info">
                        <div className={`transaction-icon ${transaction.type}`}>
                          {transaction.type === 'income' ? 
                            <TrendingUp size={16} /> : 
                            <TrendingDown size={16} />
                          }
                        </div>
                        <div>
                          <p className="transaction-description">{transaction.description}</p>
                          <p className="transaction-meta">{transaction.category} • {transaction.date}</p>
                        </div>
                      </div>
                      <span className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transactions.length === 0 && (
              <div className="card empty-state">
                <h3>Welcome to FinanceTracker!</h3>
                <p>Start by adding your first transaction above to begin tracking your finances.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions">
            <div className="transactions-header">
              <h2>All Transactions</h2>
              {transactions.length > 0 && (
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Transactions</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
              )}
            </div>
            
            <div className="card">
              {filteredTransactions.length > 0 ? (
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.date}</td>
                        <td>{transaction.description}</td>
                        <td>{transaction.category}</td>
                        <td>
                          <span className={`badge ${transaction.type}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className={`amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No transactions yet. Add your first transaction to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="budget">
            <div className="budget-header-section">
              <h2>Budget Overview</h2>
              <BudgetForm onAddBudget={addBudget} categories={categories.expense} />
            </div>
            
            {budgets.length > 0 ? (
              <div className="budget-grid">
                {budgets.map((budget) => {
                  const percentage = (budget.spent / budget.limit) * 100;
                  const isOverBudget = budget.spent > budget.limit;
                  
                  return (
                    <div key={budget.category} className="card budget-card">
                      <div className="budget-header">
                        <h3>{budget.category}</h3>
                        <Target size={20} />
                      </div>
                      <div className="budget-details">
                        <div className="budget-amounts">
                          <span>Spent: ${budget.spent.toFixed(2)}</span>
                          <span>Limit: ${budget.limit.toFixed(2)}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress ${isOverBudget ? 'over-budget' : percentage > 80 ? 'warning' : 'good'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="budget-status">
                          {percentage.toFixed(1)}% of budget used
                          {isOverBudget && <span className="over-budget-text"> (Over budget!)</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card empty-state">
                <p>No budgets set yet. Create your first budget above to start tracking your spending limits.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics">
            <h2>Financial Analytics</h2>
            
            {transactions.length > 0 ? (
              <>
                <div className="card">
                  <h3>Monthly Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="analytics-grid">
                  <div className="card">
                    <h3>Expense Categories</h3>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="no-data">No expense data available</p>
                    )}
                  </div>

                  <div className="card">
                    <h3>Category Spending</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pieData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="card empty-state">
                <p>No data available for analytics. Add some transactions to see your financial insights!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Budget Form Component
const BudgetForm = ({ onAddBudget, categories }) => {
  const [budgetData, setBudgetData] = useState({ category: '', limit: '' });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (budgetData.category && budgetData.limit) {
      onAddBudget(budgetData.category, parseFloat(budgetData.limit));
      setBudgetData({ category: '', limit: '' });
      setShowForm(false);
    }
  };

  return (
    <div className="budget-form-container">
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="add-budget-button">
          <PlusCircle size={16} />
          Add Budget
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="budget-form">
          <select
            value={budgetData.category}
            onChange={(e) => setBudgetData({...budgetData, category: e.target.value})}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Budget Limit"
            value={budgetData.limit}
            onChange={(e) => setBudgetData({...budgetData, limit: e.target.value})}
            required
          />
          <button type="submit" className="save-budget-button">Save</button>
          <button type="button" onClick={() => setShowForm(false)} className="cancel-budget-button">Cancel</button>
        </form>
      )}
    </div>
  );
};

export default PersonalFinanceTracker;