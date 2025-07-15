import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import React from 'react'; // Added for useEffect
import HomePage from './HomePage.jsx';

function App() {
  return (
    <Router>
      {/* Removed top nav with Signup/Login links */}
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
