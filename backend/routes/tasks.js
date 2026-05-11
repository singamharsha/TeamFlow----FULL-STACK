const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { taskValidator, validate } = require('../middleware/validators');

// ── Helper: Verify project membership ─────────────────────
const canAccessProject = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { ok: false, reason: 'Project not found', status: 404 };
  
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(m => m.user.toString() === userId.toString());
  const isGlobalAdmin = userRole === 'admin';
  
  if (!isOwner && !isMember && !isGlobalAdmin) {
    return { ok: false, reason: 'Access denied to this project', status: 403 };
  }
  
  const memberEntry = project.members.find(m => m.user.toString() === userId.toString());
  const projectRole = isOwner ? 'admin' : (memberEntry ? memberEntry.role : null);
  
  return { ok: true, project, projectRole };
};

// GET /api/tasks — Filtered task listing
router.get('/', protect, async (req, res) => {
  try {
    const { project, assignedTo, status, priority, overdue, page = 1, limit = 20 } = req.query;
    
    // Build query - user can only see tasks from projects they're part of
    const accessibleProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id');
    
    const projectIds = accessibleProjects.map(p => p._id);
    
    const query = { project: { $in: projectIds } };
    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }
    
    const skip = (page - 1) * limit;
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: tasks,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tasks/dashboard — Dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const accessibleProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id name color status');
    
    const projectIds = accessibleProjects.map(p => p._id);
    
    const now = new Date();
    
    const [statusStats, priorityStats, overdueCount, recentTasks, myTasks] = await Promise.all([
      // Tasks by status
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Tasks by priority
      Task.aggregate([
        { $match: { project: { $in: projectIds }, status: { $ne: 'done' } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      // Overdue count
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: now },
        status: { $ne: 'done' }
      }),
      // Recent tasks
      Task.find({ project: { $in: projectIds } })
        .populate('assignedTo', 'name avatar')
        .populate('project', 'name color')
        .sort({ updatedAt: -1 })
        .limit(5),
      // My tasks
      Task.find({ assignedTo: req.user._id, status: { $ne: 'done' } })
        .populate('project', 'name color')
        .sort({ dueDate: 1 })
        .limit(10)
    ]);
    
    res.json({
      success: true,
      data: {
        projects: { total: accessibleProjects.length, list: accessibleProjects },
        tasks: {
          byStatus: statusStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
          byPriority: priorityStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
          overdue: overdueCount
        },
        recentTasks,
        myTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tasks — Create task
router.post('/', protect, taskValidator, validate, async (req, res) => {
  try {
    const { title, description, status, priority, project, assignedTo, dueDate, tags, estimatedHours } = req.body;
    
    const access = await canAccessProject(project, req.user._id, req.user.role);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.reason });
    
    const task = await Task.create({
      title, description, status, priority, project, assignedTo, dueDate, tags, estimatedHours,
      createdBy: req.user._id
    });
    
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');
    
    res.status(201).json({ success: true, message: 'Task created', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color owner members')
      .populate('comments.user', 'name avatar');
    
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    const access = await canAccessProject(task.project._id, req.user._id, req.user.role);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.reason });
    
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    const access = await canAccessProject(task.project, req.user._id, req.user.role);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.reason });
    
    const { title, description, status, priority, assignedTo, dueDate, tags, estimatedHours, actualHours } = req.body;
    Object.assign(task, { title, description, status, priority, assignedTo, dueDate, tags, estimatedHours, actualHours });
    await task.save();
    
    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');
    
    res.json({ success: true, message: 'Task updated', data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    const access = await canAccessProject(task.project, req.user._id, req.user.role);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.reason });
    
    // Only task creator, project admin, or global admin can delete
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (!isCreator && access.projectRole !== 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only task creator or admin can delete this task' });
    }
    
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/tasks/:id/comments — Add comment
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    const access = await canAccessProject(task.project, req.user._id, req.user.role);
    if (!access.ok) return res.status(access.status).json({ success: false, message: access.reason });
    
    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name avatar');
    
    res.json({ success: true, message: 'Comment added', data: task.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
