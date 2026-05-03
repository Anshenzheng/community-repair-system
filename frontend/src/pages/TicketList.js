import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function TicketList({ user }) {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [statuses, setStatuses] = useState([]);
  
  // 筛选条件
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    fetchData();
    fetchBuildings();
    fetchStatuses();
  }, [user]);

  const fetchData = async () => {
    try {
      const params = {
        user_id: user.id,
        role: user.role,
        building: filterBuilding || undefined,
        status: filterStatus || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined
      };

      // 移除 undefined 参数
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await axios.get('/api/tickets', { params });
      setTickets(response.data);
      setFilteredTickets(response.data);
    } catch (err) {
      console.error('获取工单列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await axios.get('/api/buildings');
      setBuildings(response.data);
    } catch (err) {
      console.error('获取楼栋列表失败:', err);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await axios.get('/api/statuses');
      setStatuses(response.data);
    } catch (err) {
      console.error('获取状态列表失败:', err);
    }
  };

  const handleFilter = () => {
    fetchData();
  };

  const handleReset = () => {
    setFilterBuilding('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
    fetchData();
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>工单列表</h1>
        {user.role === 'owner' && (
          <Link to="/create" className="btn btn-primary">
            + 提交报修
          </Link>
        )}
      </div>

      {/* 筛选栏 */}
      <div className="filter-bar">
        <div className="filter-item">
          <label>楼栋</label>
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
          >
            <option value="">全部楼栋</option>
            {buildings.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-item">
          <label>状态</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-item">
          <label>开始日期</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
        </div>
        
        <div className="filter-item">
          <label>结束日期</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>
        
        <div className="filter-actions">
          <button className="btn btn-primary btn-sm" onClick={handleFilter}>
            筛选
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            重置
          </button>
        </div>
      </div>

      {/* 工单列表 */}
      {filteredTickets.length > 0 ? (
        <div className="ticket-list">
          {filteredTickets.map(ticket => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="ticket-item">
                <div className="ticket-header">
                  <div>
                    <div className="ticket-title">
                      {ticket.title}
                      <span style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>
                        #{ticket.id}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                      {ticket.description.length > 100 
                        ? ticket.description.substring(0, 100) + '...' 
                        : ticket.description}
                    </div>
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
                  {user.role === 'admin' && (
                    <div className="ticket-meta-item">
                      <span>👤</span>
                      <span>业主: {ticket.owner_name}</span>
                    </div>
                  )}
                  {ticket.assignee_name && (
                    <div className="ticket-meta-item">
                      <span>🛠️</span>
                      <span>责任人: {ticket.assignee_name}</span>
                    </div>
                  )}
                </div>
                
                <div className="ticket-footer">
                  <div className="ticket-time">
                    提交时间: {new Date(ticket.created_at).toLocaleString('zh-CN')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#667eea' }}>
                    查看详情 →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">暂无工单记录</div>
            {user.role === 'owner' && (
              <Link to="/create" className="btn btn-primary">
                提交第一个报修
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketList;
