import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks');
      setTasks(res.data.data || []);
    } catch (err) {
      console.log('Backend connection offline');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await axios.post('http://localhost:5000/api/tasks', { title, description });
      if (res.data.success) {
        fetchTasks();
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      // Fallback local update if API is unreachable
      const newTask = { _id: Date.now().toString(), title, description, completed: false };
      setTasks([newTask, ...tasks]);
      setTitle('');
      setDescription('');
    }
  };

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(t => (t._id === id || t.id === id) ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t._id !== id && t.id !== id));
  };

  // Filter & Search Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'pending') return matchesSearch && !task.completed;
    if (filter === 'completed') return matchesSearch && task.completed;
    return matchesSearch;
  });

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '30px 15px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '16px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', border: '1px solid #334155' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '26px', fontWeight: '800' }}>⚡ MERN Production Hub</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>Advanced Web & Native Mobile Task Engine</p>
        </div>

        {/* Create Task Form */}
        <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
          <input 
            type="text" 
            placeholder="Task Title..." 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: '14px 16px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#f8fafc', fontSize: '15px', outline: 'none' }}
          />
          <input 
            type="text" 
            placeholder="Description..." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: '14px 16px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#f8fafc', fontSize: '15px', outline: 'none' }}
          />
          <button 
            type="submit" 
            style={{ padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: '0.2s' }}
          >
            + Add Task
          </button>
        </form>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="🔍 Search tasks..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#f8fafc', fontSize: '14px' }}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {['all', 'pending', 'completed'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  backgroundColor: filter === type ? '#0284c7' : '#334155',
                  color: filter === type ? '#ffffff' : '#94a3b8'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Task Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', margin: '20px 0' }}>No tasks found in this view.</p>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id || task.id} style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <h4 style={{ margin: 0, color: task.completed ? '#64748b' : '#f8fafc', textDecoration: task.completed ? 'line-through' : 'none', fontSize: '16px' }}>{task.title}</h4>
                  {task.description && <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>{task.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => toggleTaskStatus(task._id || task.id)}
                    style={{ 
                      backgroundColor: task.completed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', 
                      color: task.completed ? '#4ade80' : '#facc15', 
                      border: '1px solid ' + (task.completed ? '#22c55e' : '#eab308'), 
                      padding: '6px 12px', 
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
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default App;