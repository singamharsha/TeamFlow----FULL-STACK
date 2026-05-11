import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tasksAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format, isPast, isToday, addDays } from 'date-fns'
import toast from 'react-hot-toast'

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg }}><span>{icon}</span></div>
    <div className="stat-info">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
)

const TaskRow = ({ task, onClick }) => {
  const due = task.dueDate ? new Date(task.dueDate) : null
  const overdue = due && isPast(due) && task.status !== 'done'
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <td><span className="font-bold" style={{ color: 'var(--text)' }}>{task.title}</span></td>
      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.project?.color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project.color, display: 'inline-block' }} />}
          <span className="text-muted">{task.project?.name || '—'}</span>
        </div>
      </td>
      <td>
        {due ? (
          <span className={overdue ? 'text-danger' : 'text-muted'} style={{ fontSize: 13 }}>
            {overdue ? '🔴 ' : ''}{format(due, 'MMM d, yyyy')}
          </span>
        ) : <span className="text-muted">—</span>}
      </td>
    </tr>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tasksAPI.dashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="splash-loader">
      <div className="spinner-ring"></div>
      <p>Loading dashboard…</p>
    </div>
  )

  const ts = data?.tasks?.byStatus || {}
  const total = Object.values(ts).reduce((a, b) => a + b, 0)
  const done = ts.done || 0
  const inProgress = ts['in-progress'] || 0
  const todo = ts.todo || 0
  const overdue = data?.tasks?.overdue || 0
  const projects = data?.projects?.total || 0

  const statusBars = [
    { label: 'To Do', count: todo, color: '#6b7299' },
    { label: 'In Progress', count: inProgress, color: '#3b82f6' },
    { label: 'Review', count: ts.review || 0, color: '#f59e0b' },
    { label: 'Done', count: done, color: '#10b981' },
  ]

  const myTasks = data?.myTasks || []
  const recentTasks = data?.recentTasks || []

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">👋 Hello, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}>
          ➕ New Project
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon="📁" label="Total Projects" value={projects} color="var(--primary)" bg="var(--primary-light)" />
          <StatCard icon="✅" label="Tasks Done" value={done} color="var(--success)" bg="var(--success-light)" />
          <StatCard icon="⚡" label="In Progress" value={inProgress} color="var(--info)" bg="var(--info-light)" />
          <StatCard icon="🔴" label="Overdue" value={overdue} color="var(--danger)" bg="var(--danger-light)" />
        </div>

        <div className="dashboard-grid">
          {/* Recent Tasks */}
          <div className="card">
            <div className="section-title">🕒 Recent Activity</div>
            {recentTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}>
                <div className="empty-state-icon">📝</div>
                <p>No tasks yet. Create your first project!</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Task</th><th>Status</th><th>Priority</th><th>Project</th><th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTasks.map(t => (
                      <TaskRow key={t._id} task={t} onClick={() => navigate(`/tasks?highlight=${t._id}`)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <div className="section-title">📊 Task Breakdown</div>
            <div className="mini-bar-chart">
              {statusBars.map(bar => (
                <div className="mini-bar-row" key={bar.label}>
                  <span className="mini-bar-label">{bar.label}</span>
                  <div className="mini-bar-track">
                    <div className="mini-bar-fill" style={{ width: total ? `${(bar.count / total) * 100}%` : '0%', background: bar.color }} />
                  </div>
                  <span className="mini-bar-count">{bar.count}</span>
                </div>
              ))}
            </div>

            <div className="divider" />
            <div className="section-title">📋 My Pending Tasks</div>
            {myTasks.length === 0 ? (
              <p className="text-sm text-muted">No pending tasks assigned to you.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTasks.slice(0, 5).map(t => {
                  const due = t.dueDate ? new Date(t.dueDate) : null
                  const ov = due && isPast(due)
                  return (
                    <div key={t._id} onClick={() => navigate('/tasks')}
                      style={{ padding: '10px 12px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</span>
                        <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span className="text-xs text-muted">{t.project?.name}</span>
                        {due && <span className={`text-xs ${ov ? 'text-danger' : 'text-muted'}`}>{ov ? '🔴 ' : ''}{format(due, 'MMM d')}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Projects list */}
        {data?.projects?.list?.length > 0 && (
          <div className="card" style={{ marginTop: 0 }}>
            <div className="flex-between mb-16">
              <div className="section-title" style={{ margin: 0 }}>📁 Your Projects</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>View All →</button>
            </div>
            <div className="projects-grid">
              {data.projects.list.slice(0, 3).map(p => (
                <div key={p._id} className="project-card" style={{ '--color': p.color || 'var(--primary)' }}
                  onClick={() => navigate(`/projects/${p._id}`)}>
                  <div className="project-card-header">
                    <div className="project-card-title">{p.name}</div>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                  <p className="text-sm text-muted">{p.description || 'No description'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
