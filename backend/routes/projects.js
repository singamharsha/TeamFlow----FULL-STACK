const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect, restrictTo } = require('../middleware/auth');
const { projectValidator, validate } = require('../middleware/validators');

// ── Helper: Check project access ───────────────────────────
const getProjectWithAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email avatar role')
    .populate('members.user', 'name email avatar role');
  
  if (!project) return { project: null, access: null };
  
  const isOwner = project.owner._id.toString() === userId.toString();
  const member = project.members.find(m => m.user._id.toString() === userId.toString());
  
  if (!isOwner && !member) return { project, access: null };
  
  const access = isOwner ? 'admin' : member.role;
  return { project, access };
};

// GET /api/projects — Get all accessible projects
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    
    const query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const skip = (page - 1) * limit;
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email avatar')
        .populate('members.user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(query)
    ]);
    
    // Attach task counts
    const projectsWithCounts = await Promise.all(projects.map(async (p) => {
      const taskStats = await Task.aggregate([
        { $match: { project: p._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const obj = p.toObject();
      obj.taskStats = taskStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
      obj.totalTasks = Object.values(obj.taskStats).reduce((a, b) => a + b, 0);
      return obj;
    }));
    
    res.json({
      success: true,
      data: projectsWithCounts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/projects — Create project (any authenticated user)
router.post('/', protect, projectValidator, validate, async (req, res) => {
  try {
    const { name, description, status, priority, dueDate, tags, color } = req.body;
    
    const project = await Project.create({
      name, description, status, priority, dueDate, tags, color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    
    res.status(201).json({ success: true, message: 'Project created successfully', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/projects/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const { project, access } = await getProjectWithAccess(req.params.id, req.user._id);
    
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!access && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, data: project, access });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', protect, projectValidator, validate, async (req, res) => {
  try {
    const { project, access } = await getProjectWithAccess(req.params.id, req.user._id);
    
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (access !== 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update projects' });
    }
    
    const { name, description, status, priority, dueDate, tags, color } = req.body;
    Object.assign(project, { name, description, status, priority, dueDate, tags, color });
    await project.save();
    
    res.json({ success: true, message: 'Project updated', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/projects/:id — Only owner or global admin
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete it' });
    }
    
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    
    res.json({ success: true, message: 'Project and all tasks deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/projects/:id/members — Add member
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { project, access } = await getProjectWithAccess(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (access !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    
    const { userId, role = 'member' } = req.body;
    
    const alreadyMember = project.members.some(m => m.user._id.toString() === userId);
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User is already a member' });
    
    project.members.push({ user: userId, role });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    
    res.json({ success: true, message: 'Member added', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/projects/:id/members/:userId — Remove member
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const { project, access } = await getProjectWithAccess(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (access !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    
    project.members = project.members.filter(m => m.user._id.toString() !== req.params.userId);
    await project.save();
    
    res.json({ success: true, message: 'Member removed', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
