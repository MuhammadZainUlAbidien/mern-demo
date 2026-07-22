import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
    if (!title) return;

    try {
      const res = await axios.post('http://localhost:5000/api/tasks', { title, description });
      if (res.data.success) {
        fetchTasks();
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      alert('Error connecting to backend API');
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        
        <div style={{ borderBottom: '2px solid #eef2f5', pb: '20px', mb: '30px' }}>
          <h1 style={{ color: '#1e293b', margin: 0 }}>🚀 MERN Stack Capstone Dashboard</h1>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Full-Stack Task & Project Management Application</p>
        </div>

        <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '15px', mb: '30px' }}>
          <input 
            type="text" 
            placeholder="Task Title..." 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
          />
          <input 
            type="text" 
            placeholder="Task Description..." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
          />
          <button 
            type="submit" 
            style={{ padding: '12px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            + Create Task
          </button>
        </form>

        <h3 style={{ color: '#334155' }}>Live Database Tasks:</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No tasks found. Add a task above!</p>
          ) : (
            tasks.map((task) => (
              <div key={task._id || task.id} style={{ padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a' }}>{task.title}</h4>
                  <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>{task.description}</p>
                </div>
                <span style={{ backgroundColor: task.completed ? '#dcfce7' : '#fef9c3', color: task.completed ? '#166534' : '#854d0e', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                  {task.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default App;