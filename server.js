const express = require('express');
const app = express();

// Middleware: JSON request body parse karne ke liye
app.use(express.json());

// Mock Task Data (Task Manager Entity)
let tasks = [
    { id: 1, title: "Learn Git Workflow", completed: true },
    { id: 2, title: "Build Express REST API", completed: false }
];

// 1. GET Route - Fetch all tasks
app.get('/api/tasks', (req, res) => {
    res.status(200).json({
        success: true,
        data: tasks
    });
});

// 2. POST Route - Create a new task
app.post('/api/tasks', (req, res) => {
    const newTask = {
        id: tasks.length + 1,
        title: req.body.title || "New Task",
        completed: false
    };
    tasks.push(newTask);
    res.status(201).json({
        success: true,
        message: "Task created successfully!",
        data: newTask
    });
});

// Server Port Setup
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});