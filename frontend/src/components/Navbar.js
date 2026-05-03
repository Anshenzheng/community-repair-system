import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout, currentPath }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const isActive = (path) => {
    return currentPath === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          <span>🏠</span>
          <span>小区报修系统</span>
        </Link>
        
        <div className="navbar-nav">
          <Link to="/dashboard" className={isActive('/dashboard')}>
            首页
          </Link>
          <Link to="/tickets" className={isActive('/tickets') || currentPath.startsWith('/tickets/') ? 'active' : ''}>
            工单列表
          </Link>
          {user.role === 'owner' && (
            <Link to="/create" className={isActive('/create')}>
              提交报修
            </Link>
          )}
          {user.role === 'admin' && (
            <Link to="/statistics" className={isActive('/statistics')}>
              统计分析
            </Link>
          )}
        </div>
        
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className={`user-role ${user.role}`}>
            {user.role === 'admin' ? '管理员' : '业主'}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            退出
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
