import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  // Task Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [subTaskInput, setSubTaskInput] = useState('');
  const [subTasks, setSubTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
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

  // Auth Handler
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

  // Sub-task Handler
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

  const completedCount = tasks.filter(t => t.completed).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High' && !t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'pending') return matchesSearch && !task.completed;
    if (filter === 'completed') return matchesSearch && task.completed;
    return matchesSearch;
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
      <div style={{ maxWidth: '640px', margin: '0 auto', backgroundColor: theme.card, borderRadius: '18px', padding: '25px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', border: `1px solid ${theme.border}` }}>
        
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
            {/* User Profile Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.inputBg, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, marginBottom: '15px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>👤 Welcome, {user.name || user.email}</span>
              <button onClick={handleLogout} style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                Logout
              </button>
            </div>

            {/* Analytics & Stats Bar */}
            <div style={{ backgroundColor: theme.inputBg, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span>Workspace Progress</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{completedCount} of {tasks.length} Done ({progressPercent}%)</span>
              </div>
              <div style={{ width: '100%', backgroundColor: theme.border, height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${progressPercent}%`, backgroundColor: '#38bdf8', height: '100%', transition: 'width 0.4s ease' }}></div>
              </div>

              {/* Stats Pills */}
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>📋 Total: <b>{tasks.length}</b></span>
                <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>⏳ Pending: <b>{tasks.length - completedCount}</b></span>
                <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>🔥 High Priority: <b>{highPriorityCount}</b></span>
              </div>
            </div>

            {/* Main Task Form */}
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

              {/* Sub-tasks Creator Section */}
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

            {/* Search & Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search tasks..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, fontSize: '13px' }}
              />

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
                filteredTasks.map((task) => (
                  <div key={task._id || task.id} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: theme.inputBg, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, color: task.completed ? theme.subText : theme.text, textDecoration: task.completed ? 'line-through' : 'none', fontSize: '15px' }}>{task.title}</h4>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid #0284c7' }}>
                            {task.category || 'Personal'}
                          </span>
                          {task.priority && (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '6px', backgroundColor: priorityColors[task.priority]?.bg, color: priorityColors[task.priority]?.text, border: `1px solid ${priorityColors[task.priority]?.border}` }}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        {task.description && <p style={{ margin: '0 0 6px 0', color: theme.subText, fontSize: '12px' }}>{task.description}</p>}
                        {task.dueDate && <p style={{ margin: '0 0 6px 0', color: '#38bdf8', fontSize: '11px', fontWeight: 'bold' }}>📅 Due: {task.dueDate}</p>}
                        
                        {/* Sub-tasks Checklist Display */}
                        {task.subTasks && task.subTasks.length > 0 && (
                          <div style={{ marginTop: '8px', borderTop: `1px dashed ${theme.border}`, paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {task.subTasks.map(st => (
                              <div key={st.id} onClick={() => toggleSubTask(task._id || task.id, st.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: st.completed ? theme.subText : theme.text }}>
                                <input type="checkbox" checked={st.completed} readOnly style={{ cursor: 'pointer' }} />
                                <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>{st.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button 
                          onClick={() => toggleTaskStatus(task._id || task.id)}
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
                          onClick={() => deleteTask(task._id || task.id)}
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;