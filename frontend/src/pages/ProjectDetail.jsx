import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsAPI, tasksAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'

const STATUSES = ['todo', 'in-progress', 'review', 'done']
const STATUS_LABELS = { 'todo': '📋 To Do', 'in-progress': '⚡ In Progress', 'review': '👁️ Review', 'done': '✅ Done' }
const STATUS_COLORS = { 'todo': '#6b7299', 'in-progress': '#3b82f6', 'review': '#f59e0b', 'done': '#10b981' }

function TaskModal({ onClose, onSaved, projectId, members, editTask }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: editTask?.title || '',
    description: editTask?.description || '',
    status: editTask?.status || 'todo',
    priority: editTask?.priority || 'medium',
    assignedTo: editTask?.assignedTo?._id || '',
    dueDate: editTask?.dueDate ? editTask.dueDate.slice(0, 10) : '',
    estimatedHours: editTask?.estimatedHours || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, project: projectId, estimatedHours: form.estimatedHours || undefined }
      if (editTask) {
        await tasksAPI.update(editTask._id, payload)
        toast.success('Task updated!')
      } else {
        await tasksAPI.create(payload)
        toast.success('Task created!')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{editTask ? 'Edit Task' : '➕ New Task'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Task Title *</label>
              <input className="form-control" placeholder="What needs to be done?"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} placeholder="Additional details..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select className="form-control" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members?.map(m => (
                  <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" className="form-control" value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Estimated Hours</label>
                <input type="number" className="form-control" min="0" max="1000" placeholder="e.g. 4"
                  value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [tab, setTab] = useState('board')

  const load = async () => {
    try {
      const [pr, tr] = await Promise.all([
        projectsAPI.getOne(id),
        tasksAPI.getAll({ project: id, limit: 100 })
      ])
      setProject(pr.data.data)
      setTasks(tr.data.data)
    } catch {
      toast.error('Project not found')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await tasksAPI.delete(taskId)
      toast.success('Task deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  if (loading) return <div className="splash-loader"><div className="spinner-ring" /></div>
  if (!project) return null

  const tasksByStatus = STATUSES.reduce((acc, s) => ({
    ...acc, [s]: tasks.filter(t => t.status === s)
  }), {})

  return (
    <>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 8 }}>
            ← Back to Projects
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: project.color || 'var(--primary)', display: 'inline-block' }} />
            <h1 className="page-title">{project.name}</h1>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
            <span className={`badge badge-${project.priority}`}>{project.priority}</span>
          </div>
          <p className="page-subtitle">{project.description}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true) }}>
          ➕ Add Task
        </button>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['board', 'list', 'members'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn btn-ghost btn-sm`}
              style={{ borderRadius: '8px 8px 0 0', borderBottom: tab === t ? '2px solid var(--primary)' : 'none', color: tab === t ? 'var(--primary)' : 'var(--text2)' }}>
              {t === 'board' ? '📋 Board' : t === 'list' ? '📄 List' : '👥 Members'}
            </button>
          ))}
        </div>

        {/* BOARD VIEW */}
        {tab === 'board' && (
          <div className="tasks-columns">
            {STATUSES.map(status => (
              <div key={status} className="task-column">
                <div className="task-column-header">
                  <div className="task-column-title">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />
                    {STATUS_LABELS[status]}
                  </div>
                  <span className="column-count">{tasksByStatus[status].length}</span>
                </div>
                {tasksByStatus[status].map(task => {
                  const due = task.dueDate ? new Date(task.dueDate) : null
                  const ov = due && isPast(due) && task.status !== 'done'
                  return (
                    <div key={task._id} className="task-card">
                      <div className="task-card-title">{task.title}</div>
                      <div style={{ marginBottom: 8 }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted" style={{ marginBottom: 8, lineHeight: 1.5 }}>
                          {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
                        </p>
                      )}
                      <div className="task-card-meta">
                        <div className="task-card-assignee">
                          {task.assignedTo ? (
                            <>
                              <div className="task-assignee-avatar">{task.assignedTo.name?.charAt(0)}</div>
                              <span>{task.assignedTo.name?.split(' ')[0]}</span>
                            </>
                          ) : <span className="text-xs text-muted">Unassigned</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }}
                            onClick={() => { setEditTask(task); setShowTaskModal(true) }}>✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', color: 'var(--danger)' }}
                            onClick={() => handleDeleteTask(task._id)}>🗑️</button>
                        </div>
                      </div>
                      {due && (
                        <div className={`task-due ${ov ? 'overdue' : 'ok'}`} style={{ marginTop: 8 }}>
                          📅 {format(due, 'MMM d')} {ov && <span className="badge badge-critical" style={{ fontSize: 10 }}>Overdue</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {tab === 'list' && (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Task</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Due Date</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No tasks yet</td></tr>
                  ) : tasks.map(t => {
                    const due = t.dueDate ? new Date(t.dueDate) : null
                    const ov = due && isPast(due) && t.status !== 'done'
                    return (
                      <tr key={t._id}>
                        <td><span style={{ color: 'var(--text)', fontWeight: 600 }}>{t.title}</span></td>
                        <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                        <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                        <td>{t.assignedTo?.name || <span className="text-muted">Unassigned</span>}</td>
                        <td>{due ? <span className={ov ? 'text-danger' : 'text-muted'}>{ov ? '🔴 ' : ''}{format(due, 'MMM d, yyyy')}</span> : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditTask(t); setShowTaskModal(true) }}>✏️</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteTask(t._id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MEMBERS VIEW */}
        {tab === 'members' && (
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.user?._id} className="member-item">
                <div className="user-avatar">{m.user?.name?.charAt(0)}</div>
                <div className="member-item-info">
                  <div className="member-item-name">{m.user?.name}</div>
                  <div className="member-item-email">{m.user?.email}</div>
                </div>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal
          projectId={id}
          members={project.members}
          editTask={editTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null) }}
          onSaved={() => { setShowTaskModal(false); setEditTask(null); load() }}
        />
      )}
    </>
  )
}
