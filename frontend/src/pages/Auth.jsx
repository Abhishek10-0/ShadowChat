import React, { useState, useEffect } from 'react';
import { Cloud, MessageCircle, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc'; // Google logo icon

const Button = ({ children, ...props }) => (
  <button {...props} className={`w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all group ${props.className || ''}`}>{children}</button>
);
const Input = (props) => <input {...props} className={`pl-10 bg-white/50 border-white/30 backdrop-blur-sm focus:bg-white/70 transition-all w-full py-2 rounded-lg border outline-none ${props.className || ''}`} />;

const CloudyBackground = () => (
  <>
    <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-xl animate-float" />
    <div className="absolute top-40 right-32 w-24 h-24 bg-blue-200/30 rounded-full blur-lg animate-float-slow" />
    <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-2xl animate-float-slower" />
  </>
);

const FloatingQuotes = () => (
  <>
    <div className="absolute top-1/3 left-1/4 z-30 bg-white/80 shadow-md rounded-full px-6 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 animate-float-chip0"><span className="text-indigo-400 text-lg">💬</span>Connect without boundaries</div>
    <div className="absolute top-8 right-8 z-30 bg-white/80 shadow-md rounded-full px-6 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 animate-float-chip1"><span className="text-indigo-400 text-lg">💬</span>Express freely, chat safely</div>
    <div className="absolute bottom-1/6 left-8 z-30 bg-white/80 shadow-md rounded-full px-6 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 animate-float-chip2"><span className="text-indigo-400 text-lg">💬</span>Privacy first, always</div>
    <div className="absolute bottom-8 right-8 z-30 bg-white/80 shadow-md rounded-full px-6 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 animate-float-chip3"><span className="text-indigo-400 text-lg">💬</span>Anonymous conversations matter</div>
    <div className="absolute top-1/6 left-1/8 z-30 bg-white/80 shadow-md rounded-full px-6 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 animate-float-chip4"><span className="text-indigo-400 text-lg">💬</span>Your voice, your choice</div>
    <div className="absolute bottom-1/4 right-1/6 z-30 bg-white/80 shadow-md rounded-full px-6 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 animate-float-chip5"><span className="text-indigo-400 text-lg">💬</span>Your words, your world. Speak freely.</div>
    <style>{`
      @keyframes float-chip0 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-30px);} }
      @keyframes float-chip1 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(20px);} }
      @keyframes float-chip2 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-20px);} }
      @keyframes float-chip3 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(25px);} }
      @keyframes float-chip4 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-15px);} }
      @keyframes float-chip5 { 0%,100%{transform:translateY(0);} 50%{transform:translateY(18px);} }
      .animate-float-chip0 { animation: float-chip0 7s ease-in-out infinite; }
      .animate-float-chip1 { animation: float-chip1 8s ease-in-out infinite; }
      .animate-float-chip2 { animation: float-chip2 6.5s ease-in-out infinite; }
      .animate-float-chip3 { animation: float-chip3 7.5s ease-in-out infinite; }
      .animate-float-chip4 { animation: float-chip4 8.5s ease-in-out infinite; }
      .animate-float-chip5 { animation: float-chip5 7.2s ease-in-out infinite; }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-float-slow { animation: float 10s ease-in-out infinite; }
      .animate-float-slower { animation: float 14s ease-in-out infinite; }
      @keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-20px);} }
    `}</style>
  </>
);

const SocialLogin = ({ onGoogleSuccess, onGoogleError }) => {
  const loginWithGoogle = useGoogleLogin({
    onSuccess: onGoogleSuccess,
    onError: onGoogleError,
    flow: 'implicit'
  });

  return (
    <div className="flex justify-center mt-4 w-full">
      <button
        onClick={() => loginWithGoogle()}
        className="w-full h-10 flex items-center justify-center rounded-xl font-medium gap-2 bg-white text-gray-900 border border-gray-200 shadow transition-all hover:shadow-md"
      >
        <FcGoogle className="w-5 h-5" />
        Continue with Google
      </button>
    </div>
  );
};

const rotatingQuotes = [
  'Your words, your world. Speak freely.',
  'Connect, share, and be yourself.',
  'Every thought matters. Express it.',
  'Chat without limits, connect without fear.',
  'Your voice, your space.',
  'Say what you feel, safely and anonymously.',
  'Open up, the world is listening.',
  'Freedom to chat, freedom to be you.'
];

const Auth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [slide, setSlide] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlide(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % rotatingQuotes.length);
        setSlide(true);
      }, 400); // match animation duration
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        // Login
        const res = await fetch('http://localhost:3001/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        const data = await res.json();
        if (res.ok) {
          login(data.token);
          navigate('/dashboard');
        } else {
          setError(data.error || 'Login failed');
        }
      } else {
        // Register
        const res = await fetch('http://localhost:3001/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            profilePic: '' // You can add a profilePic field to the form if needed
          })
        });
        const data = await res.json();
        if (res.ok) {
          login(data.token);
          navigate('/dashboard');
        } else {
          setError(data.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      const res = await fetch('http://localhost:3001/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: tokenResponse.credential }),
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
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <CloudyBackground />
      <FloatingQuotes />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8 animate-fade-in">
            <div className="relative inline-block">
              <div className="bg-white/20 backdrop-blur-lg rounded-full p-4 mb-4 shadow-lg border border-white/30">
                <MessageCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Cloud className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Anonymous Chat</h1>
            <p className="text-gray-600">Connect anonymously in the clouds</p>
            {/* Rotating quote below subtitle */}
            <div className="mt-3 min-h-[28px] h-7 flex items-center justify-center overflow-hidden relative">
              <span
                className={`absolute w-full text-center text-base text-indigo-500 font-medium transition-transform duration-400 ease-in-out ${slide ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}
                key={quoteIdx}
              >
                {rotatingQuotes[quoteIdx]}
              </span>
            </div>
          </div>

          <div className="bg-white/25 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/30 animate-scale-in">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100/50 rounded-full p-1 backdrop-blur-sm">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600 hover:text-indigo-600'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600 hover:text-indigo-600'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="relative animate-fade-in">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    className="pl-10"
                    onChange={handleInputChange}
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {!isLogin && (
                <div className="relative animate-fade-in">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
              <div className="flex justify-center">
                <Button type="submit" className="w-full h-10 min-h-0 flex items-center justify-center rounded-xl font-medium">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="mx-3 px-4 py-1 rounded-full bg-gray-50 text-gray-500 text-sm font-medium shadow-sm border border-gray-100">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <SocialLogin onGoogleSuccess={handleGoogleSuccess} onGoogleError={handleGoogleError} />
            {error && <div className="text-pink-500 text-sm text-center mt-2">{error}</div>}

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          <div className="text-center mt-6 animate-fade-in">
            <p className="text-xs text-gray-500">
              Your privacy matters. All chats are anonymous and encrypted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
