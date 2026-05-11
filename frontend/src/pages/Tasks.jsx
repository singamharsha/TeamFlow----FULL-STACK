import React, { useEffect, useState } from 'react'
import { tasksAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format, isPast } from 'date-fns'
import toast from 'react-hot-toast'

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', priority: '', overdue: '' })

  const load = () => {
    setLoading(true)
    const params = { assignedTo: user._id, ...filter }
    if (filter.overdue) { params.overdue = 'true'; delete params.assignedTo }
    tasksAPI.getAll(params)
      .then(r => setTasks(r.data.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id, status) => {
    try {
      await tasksAPI.update(id, { status })
      toast.success(`Moved to ${status}`)
      load()
    } catch { toast.error('Update failed') }
  }

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await tasksAPI.delete(id)
      toast.success('Task deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">✅ My Tasks</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div className="page-body">
        <div className="filters-bar">
          <select className="filter-select" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          <select className="filter-select" value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="filter-select" value={filter.overdue} onChange={e => setFilter({ ...filter, overdue: e.target.value })}>
            <option value="">All Tasks</option>
            <option value="true">🔴 Overdue Only</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status: '', priority: '', overdue: '' })}>Clear</button>
        </div>

        {loading ? (
          <div className="splash-loader" style={{ minHeight: 300 }}><div className="spinner-ring" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>No tasks found</h3>
            <p>Tasks assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => {
                    const due = t.dueDate ? new Date(t.dueDate) : null
                    const ov = due && isPast(due) && t.status !== 'done'
                    return (
                      <tr key={t._id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{t.title}</div>
                            {t.description && <div className="text-xs text-muted" style={{ marginTop: 2 }}>{t.description.slice(0, 60)}…</div>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {t.project?.color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.project.color, display: 'inline-block' }} />}
                            <span className="text-muted">{t.project?.name || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <select className="filter-select" value={t.status}
                            onChange={e => updateStatus(t._id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: 12 }}>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                        <td>
                          {due ? (
                            <span className={ov ? 'text-danger' : 'text-muted'} style={{ fontSize: 13 }}>
                              {ov ? '🔴 ' : '📅 '}{format(due, 'MMM d, yyyy')}
                            </span>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                            onClick={() => deleteTask(t._id)}>🗑️</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
