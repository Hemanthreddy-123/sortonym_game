import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { apiForgotPassword, apiOtpRequest, apiRegister } from '../api/authApi.js'
import logo from '../assets/zdotapps.png'
import emailIcon from '../assets/email_icon.png'
import whatsappIcon from '../assets/whatsapp_icon.png'
import '../styles/styleguide.css'
import './LoginPage.css'
import { useTheme } from '../hooks/useTheme'

function LoginPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { signIn, signInWithOtp, status, user } = useAuth()
  const [mode, setMode] = useState('login')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [challengeId, setChallengeId] = useState(null)
  const [teams, setTeams] = useState([])
  const [teamNo, setTeamNo] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPassword, setForgotPassword] = useState('')
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerSubmitting, setRegisterSubmitting] = useState(false)
  const [registerError, setRegisterError] = useState('')

  const otpRefs = useRef([])

  const otpKey = useMemo(() => otp.join(''), [otp])

  useEffect(() => {
    if (status === 'ready' && user) {
      navigate('/home', { replace: true })
    }
  }, [navigate, status, user])

  function onOtpChange(index, rawValue) {
    const nextValue = (rawValue || '').replace(/\s+/g, '').slice(0, 1)
    setOtp((prev) => {
      const copy = [...prev]
      copy[index] = nextValue
      return copy
    })

    if (nextValue && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  async function submitForgotPassword(e) {
    e.preventDefault()
    if (forgotSubmitting) return

    setForgotError('')
    setForgotSubmitting(true)
    try {
      const email = (forgotEmail || '').trim()
      const password = (forgotPassword || '').trim()
      const data = await apiForgotPassword({ email, password })
      setForgotPassword('')
      setForgotError('')
      setInfoMessage(data?.message || 'Password reset successful.')
      setMode('login')
    } catch (err) {
      setForgotError(err?.message || 'Unable to reset password')
    } finally {
      setForgotSubmitting(false)
    }
  }

  async function submitRegister(e) {
    e.preventDefault()
    if (registerSubmitting) return

    setRegisterError('')
    setRegisterSubmitting(true)
    try {
      const display_name = (registerName || '').trim()
      const email = (registerEmail || '').trim()
      const phone_number = (registerPhone || '').trim()
      const password = (registerPassword || '').trim()

      const data = await apiRegister({ display_name, email, phone_number, password })
      setInfoMessage(data?.message || 'Account created successfully. Please login.')
      setUsername(email)
      setPassword('')
      setOtp(['', '', '', '', '', ''])
      setChallengeId(null)
      setTeams([])
      setTeamNo('')
      setMode('login')
    } catch (err) {
      setRegisterError(err?.message || 'Unable to create account')
    } finally {
      setRegisterSubmitting(false)
    }
  }

  function onOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  async function requestOtp(channel) {
    if (submitting) return
    setErrorMessage('')
    setInfoMessage('')
    setSubmitting(true)
    try {
      const value = (username || '').trim()

      const payload = {
        channel,
        phone: channel === 'whatsapp' ? value : undefined,
        email: channel === 'email' ? value : undefined,
        team_no: teamNo || undefined,
      }

      const data = await apiOtpRequest(payload)
      setChallengeId(data.challenge_id)
      setTeams([])
      setOtp(['', '', '', '', '', ''])
      setInfoMessage(channel === 'email' ? 'Key sent to your Email Id.' : 'Key sent to your Mobile Number.')
      otpRefs.current[0]?.focus()
    } catch (err) {
      if (err?.status === 409 && Array.isArray(err?.payload?.teams)) {
        setTeams(err.payload.teams)
      }
      setChallengeId(null)
      setOtp(['', '', '', '', '', ''])
      setErrorMessage(err?.message || 'Unable to request key')
    } finally {
      setSubmitting(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (submitting) return

    setErrorMessage('')
    setInfoMessage('')
    setSubmitting(true)
    try {
      const key = otpKey
      if (challengeId && key.length === 6) {
        await signInWithOtp({ challenge_id: challengeId, otp: key })
      } else {
        await signIn({ username, password })
      }
      navigate('/home')
    } catch (err) {
      setErrorMessage(err?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-split-screen">
      {/* Left Panel - Branding */}
      <div className="login-left-panel">
        <div className="login-left-content">
          <div className="brand-logo-container">
            <div className="brain-icon-wrapper">
              <i className="bi bi-brain"></i>
            </div>
          </div>
          <h1 className="brand-title">Sortonym Challenge</h1>
          <p className="brand-subtitle">
            Master the art of word sorting. Challenge your mind, compete with players worldwide, and climb the leaderboard.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon-circle">
                <i className="bi bi-trophy"></i>
              </div>
              <div className="feature-text">
                <h3>Competitive Rankings</h3>
                <p>Track your progress and compete globally</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <div className="feature-text">
                <h3>Performance Analytics</h3>
                <p>Detailed insights into your gameplay</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon-circle">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="feature-text">
                <h3>Global Community</h3>
                <p>Join thousands of word enthusiasts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Background elements for left panel */}
        <div className="shape-circle shape-1"></div>
        <div className="shape-circle shape-2"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right-panel">
        <button className="theme-toggle-login" onClick={toggleTheme} style={{ display: 'none' }}>
          {/* Hiding theme toggle for exact match to screenshot, or we can position it discretely if needed */}
          {theme === 'light' ? <i className="bi bi-moon-fill" /> : <i className="bi bi-sun-fill" />}
        </button>

        <div className="top-nav-auth">
          <span>New to Sortonym? </span>
          <button
            className="link-create-account"
            onClick={() => {
              setMode('register')
              setErrorMessage('')
              setInfoMessage('')
            }}
          >
            Create Account
          </button>
        </div>

        <div className="login-form-container">
          <div className="login-header">
            <h2>{mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}</h2>
            <p className="login-subtitle">
              {mode === 'login' ? 'Log in to continue your word journey' : mode === 'register' ? 'Join the community of word enthusiasts' : 'Enter your email to reset your password'}
            </p>
          </div>

          {mode === 'login' ? (
            <form id="loginForm" onSubmit={onSubmit}>
              {errorMessage ? <div className="alert-message error">{errorMessage}</div> : null}
              {infoMessage ? <div className="alert-message success">{infoMessage}</div> : null}

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <i className="bi bi-envelope input-icon"></i>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="Enter your email"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      setErrorMessage('')
                      setInfoMessage('')
                    }}
                  />
                </div>
              </div>

              {teams.length ? (
                <div className="form-group mt-3">
                  <label>Team Number</label>
                  <select
                    value={teamNo}
                    onChange={(e) => {
                      setTeamNo(e.target.value)
                    }}
                    className="form-control-custom"
                  >
                    <option value="">Select team</option>
                    {teams.map((t) => (
                      <option key={`team-${t.team_no}`} value={t.team_no}>
                        Team {t.team_no}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock input-icon"></i>
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-new"
                    onClick={() => setPasswordVisible((v) => !v)}
                  >
                    <i className={`bi ${passwordVisible ? 'bi-eye' : 'bi-eye-slash'}`} />
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <label className="checkbox-container">
                  <input type="checkbox" name="remember" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <button
                  type="button"
                  className="link-forgot-password"
                  onClick={() => {
                    setInfoMessage('')
                    setErrorMessage('')
                    setMode('forgot')
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button className="btn-primary-green" type="submit" disabled={submitting}>
                Sign In <i className="bi bi-arrow-right ms-2"></i>
              </button>

              <div className="divider-or">
                <span>Or continue with</span>
              </div>

              <div className="social-login-buttons">
                <button
                  type="button"
                  className="btn-social"
                  onClick={() => {
                    setInfoMessage('Google Login initiated...')
                    setTimeout(() => setInfoMessage('Social Login is currently in demo mode.'), 1000)
                  }}
                >
                  <i className="bi bi-google"></i>
                </button>
                <button
                  type="button"
                  className="btn-social"
                  onClick={() => {
                    setInfoMessage('Facebook Login initiated...')
                    setTimeout(() => setInfoMessage('Social Login is currently in demo mode.'), 1000)
                  }}
                >
                  <i className="bi bi-facebook"></i>
                </button>
                <button
                  type="button"
                  className="btn-social"
                  onClick={() => {
                    setInfoMessage('Apple Login initiated...')
                    setTimeout(() => setInfoMessage('Social Login is currently in demo mode.'), 1000)
                  }}
                >
                  <i className="bi bi-apple"></i>
                </button>
              </div>

              <div className="first-time-box">
                <div className="info-icon"><i className="bi bi-info-circle-fill"></i></div>
                <div className="info-text">
                  <strong>First time here?</strong> Create a free account to start competing, track your progress, and join our global community of word game enthusiasts.
                </div>
              </div>

            </form>
          ) : null}

          {mode === 'forgot' ? (
            <form onSubmit={submitForgotPassword}>
              {forgotError ? <div className="alert-message error">{forgotError}</div> : null}
              {infoMessage ? <div className="alert-message success">{infoMessage}</div> : null}

              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <i className="bi bi-envelope input-icon"></i>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotSubmitting}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock input-icon"></i>
                  <input
                    type="password"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    disabled={forgotSubmitting}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <button className="btn-primary-green" type="submit" disabled={forgotSubmitting}>
                {forgotSubmitting ? 'Submitting...' : 'Submit'}
              </button>

              <button
                type="button"
                className="btn-link-back"
                onClick={() => {
                  setForgotError('')
                  setMode('login')
                }}
              >
                Back to Login
              </button>
            </form>
          ) : null}

          {mode === 'register' ? (
            <form onSubmit={submitRegister}>
              {registerError ? <div className="alert-message error">{registerError}</div> : null}
              {infoMessage ? <div className="alert-message success">{infoMessage}</div> : null}

              <div className="form-group">
                <label>User Name</label>
                <input
                  type="text"
                  className="form-control-custom"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  disabled={registerSubmitting}
                  placeholder="Choose a username"
                />
              </div>

              <div className="form-group">
                <label>E-mail ID</label>
                <input
                  type="email"
                  className="form-control-custom"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  disabled={registerSubmitting}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label>Mobile</label>
                <input
                  type="text"
                  className="form-control-custom"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  disabled={registerSubmitting}
                  placeholder="Enter mobile number"
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-control-custom"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  disabled={registerSubmitting}
                  placeholder="Create a password"
                />
              </div>

              <button className="btn-primary-green" type="submit" disabled={registerSubmitting}>
                {registerSubmitting ? 'Submitting...' : 'Create Account'}
              </button>

              <button
                type="button"
                className="btn-link-back"
                onClick={() => {
                  setRegisterError('')
                  setMode('login')
                }}
              >
                Back to Login
              </button>
            </form>
          ) : null}
        </div>

        <div className="help-box">
          <button className="btn-help"><i className="bi bi-question-circle"></i> Help</button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
