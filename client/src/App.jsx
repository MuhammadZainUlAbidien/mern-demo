import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/tasks')
      .then(res => setTasks(res.data.data))
      .catch(err => console.log('Backend sync status checked'));
  }, []);

  const addTask = (e) => {
    e.preventDefault();
    if (!title) return;
    setTasks([...tasks, { id: tasks.length + 1, title, completed: false }]);
    setTitle('');
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h1>Week 4: React Frontend Dashboard</h1>
      <form onSubmit={addTask}>
        <input 
          type="text" 
          placeholder="New Task..." 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <button type="submit">Add Task</button>
      </form>
      <ul>
        {tasks.map(t => <li key={t.id}>{t.title}</li>)}
      </ul>
    </div>
  );
}

export default App;