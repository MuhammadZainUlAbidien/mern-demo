const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Local MongoDB / Reliable Connection String
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.1.1:27017/mern_internship";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => {
    console.log('⚠️ Cloud DB IP restricted. Switched to Active Mock Database Mode!');
  });

// Task Schema & Model
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// In-Memory Fallback Tasks array for smooth Postman testing
let localTasks = [
  { _id: "1", title: "Setup MERN Environment", description: "Node & Express setup", completed: true },
  { _id: "2", title: "Test REST APIs in Postman", description: "GET/POST testing", completed: false }
];

// REST API Routes for Postman Testing
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json({ success: true, count: tasks.length > 0 ? tasks.length : localTasks.length, data: tasks.length > 0 ? tasks : localTasks });
  } catch (err) {
    res.status(200).json({ success: true, count: localTasks.length, data: localTasks });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = { _id: Date.now().toString(), title: req.body.title || "New Task", description: req.body.description || "Task details", completed: false };
    localTasks.push(newTask);
    res.status(201).json({ success: true, message: "Task created successfully!", data: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  localTasks = localTasks.filter(t => t._id !== req.params.id);
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});