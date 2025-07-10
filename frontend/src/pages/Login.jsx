import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import HeartIcon from '../components/HeartIcon';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-gradient-to-br from-[#18122B] via-[#392467] to-[#A367B1] overflow-hidden">
      {/* Subtle floating hearts/bokeh */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <svg className="absolute top-10 left-10 opacity-20" width="80" height="80" viewBox="0 0 64 64"><path d="M32 58s-22-13.6-22-30A12 12 0 0 1 32 14a12 12 0 0 1 22 14c0 16.4-22 30-22 30z" fill="#F875AA"/></svg>
        <svg className="absolute bottom-20 right-20 opacity-10" width="120" height="120" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#A367B1"/></svg>
        <svg className="absolute top-1/2 left-1/3 opacity-10" width="100" height="100" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#392467"/></svg>
      </div>
      {/* Glowing Heart Icon */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div className="animate-pulse">
          <HeartIcon className="w-24 h-24 mb-2 drop-shadow-[0_0_30px_#F875AA]" />
        </div>
        <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg text-center">Find Your Anonymous Match</h2>
        <p className="mb-2 text-lg text-pink-200 text-center max-w-xs drop-shadow">Ready to connect? Sign in and start your anonymous journey.</p>
      </div>
      {/* Glassmorphism Form */}
      <div className="relative z-10 w-full max-w-md px-6 py-10 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl flex flex-col items-center">
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div>
            <label className="block text-pink-100 mb-1" htmlFor="email">Email</label>
            <div className="relative">
              <input name="email" id="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-pink-400/30 bg-white/20 text-white placeholder-pink-200 focus:ring-2 focus:ring-pink-400 outline-none" />
              <span className="absolute left-3 top-3 text-pink-200">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 4h16v16H4V4zm0 0l8 8 8-8"/></svg>
              </span>
            </div>
          </div>
          <div>
            <label className="block text-pink-100 mb-1" htmlFor="password">Password</label>
            <div className="relative">
              <input name="password" id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-pink-400/30 bg-white/20 text-white placeholder-pink-200 focus:ring-2 focus:ring-pink-400 outline-none pr-10" />
              <button type="button" tabIndex={-1} className="absolute right-3 top-3 text-pink-200" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M17.94 17.94A10.97 10.97 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.94M1 1l22 22"/></svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white font-semibold text-lg shadow hover:from-pink-600 hover:to-purple-600 transition">Sign In</button>
          {error && <div className="text-pink-200 text-sm text-center">{error}</div>}
        </form>
        <div className="w-full mt-8 flex flex-col items-center gap-4">
          <span className="text-pink-100">or</span>
          <GoogleLogin
            width="100%"
            onSuccess={async (credentialResponse) => {
              try {
                const res = await fetch('http://localhost:3001/google-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken: credentialResponse.credential }),
                });
                const data = await res.json();
                if (res.ok) {
                  login(data.token);
                  navigate('/dashboard');
                } else {
                  setError(data.error || 'Google login failed');
                }
              } catch (err) {
                setError('Google login failed');
              }
            }}
            onError={() => setError('Google login failed')}
          />
        </div>
        <div className="mt-10 text-pink-100 text-base text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-pink-300 font-semibold hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
} 