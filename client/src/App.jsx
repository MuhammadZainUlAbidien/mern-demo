import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('mern_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Auth States
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('mern_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');

  // View States
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'analytics'

  // Task Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [subTaskInput, setSubTaskInput] = useState('');
  const [subTasks, setSubTasks] = useState([]);
  
  // Filtering & Sorting
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const API_URL = 'http://localhost:5000/api/tasks';
  const AUTH_URL = 'http://localhost:5000/api/auth';

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('mern_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const playSoundAndHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(40);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res.data.data) setTasks(res.data.data);
    } catch (err) {
      console.log('Using local cached state');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    playSoundAndHaptic();

    try {
      const endpoint = authMode === 'login' ? `${AUTH_URL}/login` : `${AUTH_URL}/register`;
      const res = await axios.post(endpoint, authForm);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('mern_user', JSON.stringify(res.data.user));
        localStorage.setItem('token', res.data.token);
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Check server connection.');
      const dummyUser = { name: authForm.name || 'Zain', email: authForm.email };
      setUser(dummyUser);
      localStorage.setItem('mern_user', JSON.stringify(dummyUser));
    }
  };

  const handleLogout = () => {
    playSoundAndHaptic();
    setUser(null);
    localStorage.removeItem('mern_user');
    localStorage.removeItem('token');
  };

  const handleAddSubTask = (e) => {
    e.preventDefault();
    if (!subTaskInput.trim()) return;
    setSubTasks([...subTasks, { id: Date.now(), text: subTaskInput, completed: false }]);
    setSubTaskInput('');
  };

  const toggleSubTask = (taskId, subTaskId) => {
    playSoundAndHaptic();
    setTasks(tasks.map(t => {
      if ((t._id === taskId || t.id === taskId) && t.subTasks) {
        const updatedSubs = t.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
        return { ...t, subTasks: updatedSubs };
      }
      return t;
    }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    playSoundAndHaptic();

    const tempTask = {
      _id: Date.now().toString(),
      title,
      description,
      priority,
      category,
      dueDate,
      subTasks,
      createdAt: new Date().toLocaleDateString(),
      userId: user ? user.email : 'guest',
      completed: false
    };

    try {
      const res = await axios.post(API_URL, tempTask);
      if (res.data.success) fetchTasks();
      else setTasks([tempTask, ...tasks]);
    } catch (err) {
      setTasks([tempTask, ...tasks]);
    }

    setTitle('');
    setDescription('');
    setDueDate('');
    setSubTasks([]);
  };

  const startEditing = (task) => {
    playSoundAndHaptic();
    setEditingTaskId(task._id || task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id) => {
    playSoundAndHaptic();
    setTasks(tasks.map(t => (t._id === id || t.id === id) ? { ...t, title: editTitle } : t));
    setEditingTaskId(null);
  };

  const toggleTaskStatus = async (id) => {
    playSoundAndHaptic();
    setTasks(tasks.map(t => (t._id === id || t.id === id) ? { ...t, completed: !t.completed } : t));
    try {
      await axios.put(`${API_URL}/${id}`);
    } catch (err) {}
  };

  const deleteTask = async (id) => {
    playSoundAndHaptic();
    setTasks(tasks.filter(t => t._id !== id && t.id !== id));
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (err) {}
  };

  const clearCompleted = () => {
    playSoundAndHaptic();
    if (window.confirm("Are you sure you want to clear all completed tasks?")) {
      setTasks(tasks.filter(t => !t.completed));
    }
  };

  const exportToCSV = () => {
    playSoundAndHaptic();
    if (tasks.length === 0) return alert('No tasks to export!');
    let csvContent = "data:text/csv;charset=utf-8,Title,Description,Priority,Category,Due Date,Completed\n";
    tasks.forEach(t => {
      csvContent += `"${t.title}","${t.description || ''}","${t.priority || 'Medium'}","${t.category || 'General'}","${t.dueDate || ''}","${t.completed ? 'Yes' : 'No'}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${user?.name || 'User'}_Tasks_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDateStatus = (dateString) => {
    if (!dateString) return null;
    const today = new Date().toISOString().split('T')[0];
    if (dateString < today) return { label: 'Overdue', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' };
    if (dateString === today) return { label: 'Due Today', color: '#facc15', bg: 'rgba(234, 179, 8, 0.15)' };
    return null;
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High' && !t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Chart Data Computation
  const categoriesList = ['Personal', 'Work', 'University', 'Finance'];
  const categoryData = categoriesList.map(cat => ({
    name: cat,
    value: tasks.filter(t => (t.category || 'Personal') === cat).length
  })).filter(d => d.value > 0);

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'High').length, color: '#f87171' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length, color: '#facc15' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length, color: '#4ade80' }
  ].filter(d => d.value > 0);

  const CATEGORY_COLORS = ['#38bdf8', '#a855f7', '#f43f5e', '#10b981'];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'All' || task.category === selectedCategoryFilter;
    
    if (filter === 'pending') return matchesSearch && matchesCategory && !task.completed;
    if (filter === 'completed') return matchesSearch && matchesCategory && task.completed;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'priority') {
      const weight = { High: 3, Medium: 2, Low: 1 };
      return (weight[b.priority] || 0) - (weight[a.priority] || 0);
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'oldest') {
      return (a._id || a.id) - (b._id || b.id);
    }
    return (b._id || b.id) - (a._id || a.id);
  });

  const theme = {
    bg: isDarkMode ? '#0f172a' : '#f1f5f9',
    card: isDarkMode ? '#1e293b' : '#ffffff',
    text: isDarkMode ? '#f8fafc' : '#0f172a',
    subText: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#e2e8f0',
    inputBg: isDarkMode ? '#0f172a' : '#f8fafc'
  };

  const priorityColors = {
    High: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444' },
    Medium: { bg: 'rgba(234, 179, 8, 0.2)', text: '#facc15', border: '#eab308' },
    Low: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80', border: '#22c55e' }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', padding: '20px 15px', transition: '0.3s' }}>
      <div style={{ maxWidth: '660px', margin: '0 auto', backgroundColor: theme.card, borderRadius: '18px', padding: '25px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', border: `1px solid ${theme.border}` }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '24px', fontWeight: '800' }}>⚡ MERN SaaS Hub</h2>
            <p style={{ color: theme.subText, fontSize: '13px', marginTop: '3px' }}>Enterprise Task Management System</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {user && (
              <button 
                onClick={exportToCSV}
                title="Export CSV"
                style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: '#38bdf8', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                📥 CSV
              </button>
            )}
            <button 
              onClick={() => { playSoundAndHaptic(); setIsDarkMode(!isDarkMode); }}
              style={{ padding: '8px 12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* AUTHENTICATION VIEW */}
        {!user ? (
          <div style={{ backgroundColor: theme.inputBg, padding: '20px', borderRadius: '14px', border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#38bdf8', textAlign: 'center' }}>
              {authMode === 'login' ? '🔑 Sign In to Your Workspace' : '🚀 Create Account'}
            </h3>
            {authError && <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center' }}>{authError}</p>}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {authMode === 'register' && (
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required
                  value={authForm.name} 
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  style={{ padding: '12px', borderRadius: '8px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
                />
              )}
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                value={authForm.email} 
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
              />
              <input 
                type="password" 
                placeholder="Password" 
                required
                value={authForm.password} 
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                style={{ padding: '12px', borderRadius: '8px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
              />

              <button type="submit" style={{ padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                {authMode === 'login' ? 'Sign In' : 'Register Now'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '12px', color: theme.subText, marginTop: '15px', cursor: 'pointer' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? "Don't have an account? Create One" : "Already have an account? Sign In"}
            </p>
          </div>
        ) : (
          /* LOGGED IN WORKSPACE VIEW */
          <div>
            {/* User Profile & Navigation Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.inputBg, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, marginBottom: '15px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>👤 Welcome, {user.name || user.email}</span>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => { playSoundAndHaptic(); setActiveTab('tasks'); }} 
                  style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'tasks' ? '#0284c7' : 'transparent', color: activeTab === 'tasks' ? '#fff' : theme.subText, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  📋 Tasks
                </button>
                <button 
                  onClick={() => { playSoundAndHaptic(); setActiveTab('analytics'); }} 
                  style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', backgroundColor: activeTab === 'analytics' ? '#0284c7' : 'transparent', color: activeTab === 'analytics' ? '#fff' : theme.subText, cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  📊 Analytics
                </button>
                <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>
                  Logout
                </button>
              </div>
            </div>

            {/* TAB 1: MAIN TASKS VIEW */}
            {activeTab === 'tasks' && (
              <div>
                {/* Analytics & Stats Bar */}
                <div style={{ backgroundColor: theme.inputBg, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span>Workspace Progress</span>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{completedCount} of {tasks.length} Done ({progressPercent}%)</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: theme.border, height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ width: `${progressPercent}%`, backgroundColor: '#38bdf8', height: '100%', transition: 'width 0.4s ease' }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>📋 Total: <b>{tasks.length}</b></span>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>⏳ Pending: <b>{tasks.length - completedCount}</b></span>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>🔥 High: <b>{highPriorityCount}</b></span>
                    </div>

                    {completedCount > 0 && (
                      <button onClick={clearCompleted} style={{ backgroundColor: 'transparent', color: '#f87171', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', textDecoration: 'underline' }}>
                        🧹 Clear Completed ({completedCount})
                      </button>
                    )}
                  </div>
                </div>

                {/* Task Creation Form */}
                <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="Task Title..." 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', outline: 'none' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Description..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', outline: 'none' }}
                  />
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '12px' }}
                    >
                      <option value="Personal">👤 Personal</option>
                      <option value="Work">💼 Work</option>
                      <option value="University">📚 University</option>
                      <option value="Finance">💰 Finance</option>
                    </select>

                    <select 
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '12px' }}
                    >
                      <option value="High">🔥 High</option>
                      <option value="Medium">⚡ Medium</option>
                      <option value="Low">🌱 Low</option>
                    </select>

                    <input 
                      type="date" 
                      value={dueDate} 
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="+ Add Sub-task checklist item..." 
                      value={subTaskInput} 
                      onChange={(e) => setSubTaskInput(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '12px' }}
                    />
                    <button type="button" onClick={handleAddSubTask} style={{ padding: '8px 12px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: '#38bdf8', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      Add Item
                    </button>
                  </div>

                  {subTasks.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {subTasks.map((st) => (
                        <span key={st.id} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.subText }}>
                          ▫️ {st.text}
                        </span>
                      ))}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    style={{ padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}
                  >
                    + Create Task
                  </button>
                </form>

                {/* Category Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                  {['All', 'Personal', 'Work', 'University', 'Finance'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { playSoundAndHaptic(); setSelectedCategoryFilter(cat); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${selectedCategoryFilter === cat ? '#0284c7' : theme.border}`,
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: selectedCategoryFilter === cat ? '#0284c7' : theme.inputBg,
                        color: selectedCategoryFilter === cat ? '#ffffff' : theme.subText,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cat === 'All' ? '📂 All Categories' : cat}
                    </button>
                  ))}
                </div>

                {/* Search, Status & Sorting Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="🔍 Search tasks..." 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ flex: 2, padding: '10px 14px', borderRadius: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '13px' }}
                    />

                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '12px', fontWeight: '600' }}
                    >
                      <option value="newest">↕️ Newest First</option>
                      <option value="oldest">↕️ Oldest First</option>
                      <option value="priority">🔥 High Priority</option>
                      <option value="dueDate">📅 Due Date</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {['all', 'pending', 'completed'].map((type) => (
                      <button
                        key={type}
                        onClick={() => { playSoundAndHaptic(); setFilter(type); }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                          backgroundColor: filter === type ? '#0284c7' : theme.inputBg,
                          color: filter === type ? '#ffffff' : theme.subText
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Task Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTasks.length === 0 ? (
                    <p style={{ textAlign: 'center', color: theme.subText, fontSize: '13px', margin: '15px 0' }}>No tasks found in this view.</p>
                  ) : (
                    filteredTasks.map((task) => {
                      const id = task._id || task.id;
                      const dateStatus = getDateStatus(task.dueDate);

                      return (
                        <div key={id} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, paddingRight: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                {editingTaskId === id ? (
                                  <div style={{ display: 'flex', gap: '6px', width: '100%', marginBottom: '4px' }}>
                                    <input 
                                      type="text" 
                                      value={editTitle} 
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', flex: 1 }}
                                    />
                                    <button onClick={() => saveEdit(id)} style={{ padding: '4px 8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Save</button>
                                  </div>
                                ) : (
                                  <h4 style={{ margin: 0, color: task.completed ? theme.subText : theme.text, textDecoration: task.completed ? 'line-through' : 'none', fontSize: '15px' }}>
                                    {task.title}
                                  </h4>
                                )}

                                <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid #0284c7' }}>
                                  {task.category || 'Personal'}
                                </span>
                                {task.priority && (
                                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px', backgroundColor: priorityColors[task.priority]?.bg, color: priorityColors[task.priority]?.text, border: `1px solid ${priorityColors[task.priority]?.border}` }}>
                                    {task.priority}
                                  </span>
                                )}
                                {dateStatus && !task.completed && (
                                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px', backgroundColor: dateStatus.bg, color: dateStatus.color, border: `1px solid ${dateStatus.color}` }}>
                                    {dateStatus.label}
                                  </span>
                                )}
                              </div>

                              {task.description && <p style={{ margin: '0 0 6px 0', color: theme.subText, fontSize: '12px' }}>{task.description}</p>}
                              
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '11px' }}>
                                {task.dueDate && <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>📅 Due: {task.dueDate}</span>}
                                {task.createdAt && <span style={{ color: theme.subText }}>🕒 {task.createdAt}</span>}
                              </div>
                              
                              {task.subTasks && task.subTasks.length > 0 && (
                                <div style={{ marginTop: '8px', borderTop: `1px dashed ${theme.border}`, paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {task.subTasks.map(st => (
                                    <div key={st.id} onClick={() => toggleSubTask(id, st.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: st.completed ? theme.subText : theme.text }}>
                                      <input type="checkbox" checked={st.completed} readOnly style={{ cursor: 'pointer' }} />
                                      <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>{st.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <button 
                                onClick={() => startEditing(task)}
                                title="Edit Title"
                                style={{ backgroundColor: theme.inputBg, color: theme.subText, border: `1px solid ${theme.border}`, padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => toggleTaskStatus(id)}
                                style={{ 
                                  backgroundColor: task.completed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', 
                                  color: task.completed ? '#4ade80' : '#facc15', 
                                  border: '1px solid ' + (task.completed ? '#22c55e' : '#eab308'), 
                                  padding: '5px 10px', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  fontSize: '12px', 
                                  fontWeight: 'bold' 
                                }}
                              >
                                {task.completed ? '✓ Done' : '⏳ Pending'}
                              </button>
                              <button 
                                onClick={() => deleteTask(id)}
                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE ANALYTICS DASHBOARD */}
            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ backgroundColor: theme.inputBg, padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#38bdf8' }}>📊 Category Distribution</h3>
                  {categoryData.length === 0 ? (
                    <p style={{ fontSize: '12px', color: theme.subText }}>No data available yet. Create tasks to see chart breakdown.</p>
                  ) : (
                    <div style={{ height: '200px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: theme.inputBg, padding: '16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#38bdf8' }}>🔥 Priority Breakdown</h3>
                  {priorityData.length === 0 ? (
                    <p style={{ fontSize: '12px', color: theme.subText }}>No tasks to analyze.</p>
                  ) : (
                    <div style={{ height: '180px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priorityData}>
                          <XAxis dataKey="name" stroke={theme.subText} fontSize={12} />
                          <YAxis stroke={theme.subText} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default App;