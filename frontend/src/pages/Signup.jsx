import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', profilePic: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Signup failed');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2>Signup</h2>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="profilePic" placeholder="Profile Picture URL" value={form.profilePic} onChange={handleChange} />
        <button type="submit">Sign Up</button>
        {error && <div style={{color:'red'}}>{error}</div>}
      </form>
      <div style={{marginTop: 16}}>
        <GoogleLogin
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
    </>
  );
} 