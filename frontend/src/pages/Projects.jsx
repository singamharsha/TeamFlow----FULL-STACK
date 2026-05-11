import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#14b8a6']

function ProjectModal({ onClose, onSaved, editProject }) {
  const [form, setForm] = useState({
    name: editProject?.name || '',
    description: editProject?.description || '',
    status: editProject?.status || 'planning',
    priority: editProject?.priority || 'medium',
    dueDate: editProject?.dueDate ? editProject.dueDate.slice(0, 10) : '',
    color: editProject?.color || '#6366f1',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editProject) {
        await projectsAPI.update(editProject._id, form)
        toast.success('Project updated!')
      } else {
        await projectsAPI.create(form)
        toast.success('Project created! 🎉')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{editProject ? 'Edit Project' : '➕ New Project'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Project Name *</label>
              <input className="form-control" placeholder="e.g. Website Redesign"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={3} placeholder="What is this project about?"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" className="form-control" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm({ ...form, color: c })}
                    style={{
                      width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer',
                      border: form.color === c ? '3px solid white' : '3px solid transparent',
                      transition: 'border 0.15s', boxSizing: 'border-box'
                    }} />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [filter, setFilter] = useState({ status: '', priority: '' })

  const load = () => {
    setLoading(true)
    projectsAPI.getAll(filter)
      .then(r => setProjects(r.data.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return
    try {
      await projectsAPI.delete(id)
      toast.success('Project deleted')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">📁 Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true) }}>
          ➕ New Project
        </button>
      </div>

      <div className="page-body">
        <div className="filters-bar">
          <select className="filter-select" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <select className="filter-select" value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status: '', priority: '' })}>Clear</button>
        </div>

        {loading ? (
          <div className="splash-loader" style={{ minHeight: 300 }}><div className="spinner-ring" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => {
              const total = p.totalTasks || 0
              const done = p.taskStats?.done || 0
              const pct = total ? Math.round((done / total) * 100) : 0
              const isOwner = p.owner?._id === user?._id
              return (
                <div key={p._id} className="project-card" style={{ '--color': p.color }}
                  onClick={() => navigate(`/projects/${p._id}`)}>
                  <div className="project-card-header">
                    <div className="project-card-title">{p.name}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                      {(isOwner || isAdmin) && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}
                          onClick={e => { e.stopPropagation(); setEditProject(p); setShowModal(true) }}>✏️</button>
                      )}
                      {(isOwner || isAdmin) && (
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', color: 'var(--danger)' }}
                          onClick={e => handleDelete(p._id, e)}>🗑️</button>
                      )}
                    </div>
                  </div>
                  <p className="project-card-desc">{p.description || 'No description provided.'}</p>
                  <div className="project-progress">
                    <div className="progress-label">
                      <span>{done}/{total} tasks done</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="project-meta">
                    <span className={`badge badge-${p.priority}`}>{p.priority}</span>
                    {p.dueDate && (
                      <span className="text-xs text-muted">📅 {format(new Date(p.dueDate), 'MMM d, yyyy')}</span>
                    )}
                    <div className="avatars-cluster" style={{ marginLeft: 'auto' }}>
                      {p.members?.slice(0, 4).map(m => (
                        <div key={m.user?._id} className="user-avatar" title={m.user?.name} style={{ width: 26, height: 26, fontSize: 11 }}>
                          {m.user?.name?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ProjectModal
          editProject={editProject}
          onClose={() => { setShowModal(false); setEditProject(null) }}
          onSaved={() => { setShowModal(false); setEditProject(null); load() }}
        />
      )}
    </>
  )
}
