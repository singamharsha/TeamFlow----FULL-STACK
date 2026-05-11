import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-logo">
            <div className="auth-logo-icon">⚡</div>
            <span className="auth-logo-text">TeamFlow</span>
          </div>
          <h1>Manage Projects,<br /><span>Ship Faster.</span></h1>
          <p>The all-in-one workspace for teams to collaborate, track tasks, and deliver results.</p>
          <div className="auth-features">
            {[
              { icon: '🔐', text: 'Role-based access control (Admin / Member)' },
              { icon: '📊', text: 'Real-time dashboard with overdue alerts' },
              { icon: '🚀', text: 'Kanban board with drag-and-drop tasks' },
              { icon: '👥', text: 'Full team & project management' },
            ].map((f, i) => (
              <div className="auth-feature" key={i}>
                <div className="auth-feature-icon">{f.icon}</div>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <h2>Welcome back</h2>
          <p>Sign in to your TeamFlow account</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input id="login-email" className="form-control" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-group">
                <input id="login-password" className="form-control"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
                <span className="input-group-icon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="divider" />
          <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one free</Link>
          </p>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <p className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 700 }}>🧪 Demo Credentials</p>
            <p className="text-xs text-muted">Admin: admin@teamflow.com / admin123</p>
            <p className="text-xs text-muted">Member: member@teamflow.com / member123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
