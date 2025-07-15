import { useState, useEffect } from 'react';
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

  // Animated sliding quotes logic
  const quotes = [
    '"Connect anonymously, chat freely."',
    '"Your next friend is just a message away."',
    '"Privacy first. Friendship always."',
    '"Find your match, no strings attached."',
    '"Real talk. Real people. Real private."',
  ];
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [slide, setSlide] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlide(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % quotes.length);
        setSlide(true);
      }, 400); // match animation duration
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <HeartIcon className="w-16 h-16 mb-2" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome Back!</h2>
        <p className="mb-4 text-gray-500 text-center">Sign in to continue your anonymous journey.</p>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">Email</label>
            <input name="email" id="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 outline-none" />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">Password</label>
            <div className="relative">
              <input name="password" id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink-400 outline-none pr-10" />
              <button type="button" tabIndex={-1} className="absolute right-3 top-2 text-gray-400" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M17.94 17.94A10.97 10.97 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.94M1 1l22 22"/></svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full py-2 rounded-lg bg-pink-500 text-white font-semibold text-lg shadow hover:bg-pink-600 transition">Sign In</button>
          {error && <div className="text-pink-500 text-sm text-center">{error}</div>}
        </form>
        <div className="w-full mt-6 flex flex-col items-center gap-2">
          <span className="text-gray-400">or</span>
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
        <div className="mt-6 text-gray-600 text-base text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-pink-500 font-semibold hover:underline">Sign up</Link>
        </div>
        {/* Animated sliding quotes placeholder */}
        <div className="mt-8 w-full h-16 flex items-center justify-center overflow-hidden relative login-quotes-placeholder">
          <span
            className={`absolute w-full text-center text-lg text-gray-500 transition-transform duration-400 ease-in-out ${slide ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}
            key={quoteIdx}
          >
            {quotes[quoteIdx]}
          </span>
        </div>
      </div>
    </div>
  );
} 