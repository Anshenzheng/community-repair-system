import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard({ user }) {
  const [recentTickets, setRecentTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const params = { user_id: user.id, role: user.role };
      const ticketsResponse = await axios.get('/api/tickets', { params });
      
      const tickets = ticketsResponse.data;
      const pending = tickets.filter(t => t.status === 'pending').length;
      const processing = tickets.filter(t => t.status === 'accepted' || t.status === 'processing').length;
      const completed = tickets.filter(t => t.status === 'completed' || t.status === 'closed').length;
      
      setStats({
        total: tickets.length,
        pending,
        processing,
        completed
      });
      
      // 获取最近5个工单
      setRecentTickets(tickets.slice(0, 5));
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <h1 className="page-title">
        欢迎回来，{user.name}
        <span style={{ fontSize: '14px', color: '#999', marginLeft: '10px' }}>
          {user.building && user.room ? `${user.building}${user.room}` : ''}
        </span>
      </h1>

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-value">{stats.total}</div>
          <div className="stats-label">总工单数</div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #ffc107' }}>
          <div className="stats-value" style={{ color: '#ffc107' }}>{stats.pending}</div>
          <div className="stats-label">待处理</div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #17a2b8' }}>
          <div className="stats-value" style={{ color: '#17a2b8' }}>{stats.processing}</div>
          <div className="stats-label">处理中</div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #28a745' }}>
          <div className="stats-value" style={{ color: '#28a745' }}>{stats.completed}</div>
          <div className="stats-label">已完成</div>
        </div>
      </div>

      {/* 快捷操作 */}
      {user.role === 'owner' && (
        <div className="card">
          <h3 style={{ marginBottom: '15px', color: '#333' }}>快捷操作</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <Link to="/create" className="btn btn-primary">
              📝 提交报修
            </Link>
            <Link to="/tickets" className="btn btn-secondary">
              📋 查看工单
            </Link>
          </div>
        </div>
      )}

      {user.role === 'admin' && (
        <div className="card">
          <h3 style={{ marginBottom: '15px', color: '#333' }}>快捷操作</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <Link to="/tickets" className="btn btn-primary">
              📋 工单管理
            </Link>
            <Link to="/statistics" className="btn btn-success">
              📊 统计分析
            </Link>
          </div>
        </div>
      )}

      {/* 最近工单 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: '#333' }}>最近工单</h3>
          <Link to="/tickets" style={{ textDecoration: 'none', color: '#667eea', fontSize: '14px' }}>
            查看全部 →
          </Link>
        </div>
        
        {recentTickets.length > 0 ? (
          <div className="ticket-list">
            {recentTickets.map(ticket => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="ticket-item">
                  <div className="ticket-header">
                    <div>
                      <div className="ticket-title">{ticket.title}</div>
                    </div>
                    <span className={`status-badge status-${ticket.status}`}>
                      {ticket.status_name}
                    </span>
                  </div>
                  <div className="ticket-meta">
                    <div className="ticket-meta-item">
                      <span>📍</span>
                      <span>{ticket.building}{ticket.room}</span>
                    </div>
                    <div className="ticket-meta-item">
                      <span>🔧</span>
                      <span>{ticket.fault_type}</span>
                    </div>
                    {ticket.assignee_name && (
                      <div className="ticket-meta-item">
                        <span>👤</span>
                        <span>责任人: {ticket.assignee_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="ticket-footer">
                    <div className="ticket-time">
                      提交时间: {new Date(ticket.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无工单记录</div>
            {user.role === 'owner' && (
              <Link to="/create" className="btn btn-primary">
                提交第一个报修
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
