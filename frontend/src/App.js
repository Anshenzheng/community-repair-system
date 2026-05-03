import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import CreateTicket from './pages/CreateTicket';
import Statistics from './pages/Statistics';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      {user ? (
        <AppLayout user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </Router>
  );
}

function AppLayout({ user, onLogout }) {
  const location = useLocation();

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} currentPath={location.pathname} />
      <div className="container" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/tickets" element={<TicketList user={user} />} />
          <Route path="/tickets/:id" element={<TicketDetail user={user} />} />
          <Route path="/create" element={<CreateTicket user={user} />} />
          {user.role === 'admin' && (
            <Route path="/statistics" element={<Statistics user={user} />} />
          )}
        </Routes>
      </div>
    </div>
  );
}

export default App;
