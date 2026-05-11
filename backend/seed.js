/**
 * Database Seeder — Creates demo admin + member + project + tasks
 * Run: node backend/seed.js
 */
require('dotenv').config({ path: './backend/.env' })
const mongoose = require('mongoose')
const User = require('./backend/models/User')
const Project = require('./backend/models/Project')
const Task = require('./backend/models/Task')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamtaskmanager'

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  // Clear existing data
  await Promise.all([User.deleteMany(), Project.deleteMany(), Task.deleteMany()])
  console.log('🗑️  Cleared existing data')

  // Create users
  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@teamflow.com',
    password: 'admin123',
    role: 'admin'
  })

  const member = await User.create({
    name: 'Morgan Member',
    email: 'member@teamflow.com',
    password: 'member123',
    role: 'member'
  })

  const member2 = await User.create({
    name: 'Jordan Dev',
    email: 'jordan@teamflow.com',
    password: 'member123',
    role: 'member'
  })

  console.log('👤 Created 3 users')

  // Create projects
  const project1 = await Project.create({
    name: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX.',
    status: 'active',
    priority: 'high',
    color: '#6366f1',
    owner: admin._id,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    members: [
      { user: admin._id, role: 'admin' },
      { user: member._id, role: 'member' },
      { user: member2._id, role: 'member' }
    ]
  })

  const project2 = await Project.create({
    name: 'Mobile App v2',
    description: 'Build the next version of our mobile application with new features.',
    status: 'planning',
    priority: 'critical',
    color: '#8b5cf6',
    owner: admin._id,
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    members: [
      { user: admin._id, role: 'admin' },
      { user: member2._id, role: 'member' }
    ]
  })

  console.log('📁 Created 2 projects')

  // Create tasks
  const tasks = [
    { title: 'Design homepage mockup', status: 'done', priority: 'high', project: project1._id, assignedTo: member._id, createdBy: admin._id, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { title: 'Implement navigation component', status: 'in-progress', priority: 'high', project: project1._id, assignedTo: member._id, createdBy: admin._id, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { title: 'Mobile responsiveness testing', status: 'todo', priority: 'medium', project: project1._id, assignedTo: member2._id, createdBy: admin._id, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { title: 'SEO optimization', status: 'todo', priority: 'low', project: project1._id, assignedTo: member._id, createdBy: admin._id },
    { title: 'Performance audit', status: 'review', priority: 'medium', project: project1._id, assignedTo: admin._id, createdBy: admin._id, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { title: 'Fix broken links', status: 'todo', priority: 'critical', project: project1._id, assignedTo: member._id, createdBy: admin._id, dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { title: 'Define app architecture', status: 'done', priority: 'critical', project: project2._id, assignedTo: admin._id, createdBy: admin._id },
    { title: 'User authentication flow', status: 'in-progress', priority: 'high', project: project2._id, assignedTo: member2._id, createdBy: admin._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { title: 'Push notifications setup', status: 'todo', priority: 'medium', project: project2._id, assignedTo: member2._id, createdBy: admin._id },
  ]

  await Task.insertMany(tasks)
  console.log(`✅ Created ${tasks.length} tasks`)
  console.log('\n🎉 Seed complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 admin@teamflow.com    / admin123  (Admin)')
  console.log('📧 member@teamflow.com   / member123 (Member)')
  console.log('📧 jordan@teamflow.com   / member123 (Member)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
