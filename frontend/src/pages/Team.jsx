import React, { useEffect, useState } from 'react'
import { usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Team() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => {
    usersAPI.getAll({ search })
      .then(r => setUsers(r.data.data))
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search])

  const changeRole = async (id, role) => {
    try {
      await usersAPI.updateRole(id, role)
      toast.success(`Role updated to ${role}`)
      load()
    } catch { toast.error('Failed to update role') }
  }

  const toggleStatus = async (id, isActive) => {
    try {
      await usersAPI.updateStatus(id, !isActive)
      toast.success(isActive ? 'User deactivated' : 'User activated')
      load()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Team</h1>
          <p className="page-subtitle">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="page-body">
        <div className="filters-bar">
          <div className="search-box">
            <span>🔍</span>
            <input placeholder="Search by name or email…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="splash-loader" style={{ minHeight: 300 }}><div className="spinner-ring" /></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Member</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{u.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-active' : 'badge-on-hold'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-muted">{u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <select className="filter-select" value={u.role}
                              onChange={e => changeRole(u._id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: 12 }}>
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => toggleStatus(u._id, u.isActive)}>
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
