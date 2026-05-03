import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';

const COLORS = ['#667eea', '#764ba2', '#11998e', '#38ef7d', '#f093fb', '#f5576c'];

function Statistics({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats', {
        params: { role: 'admin' }
      });
      setStats(response.data);
    } catch (err) {
      setError('获取统计数据失败');
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!stats) {
    return (
      <div className="card">
        <div className="error-message">无法获取统计数据</div>
      </div>
    );
  }

  // 准备状态统计数据
  const statusData = [
    { name: '待处理', value: stats.status_counts?.pending || 0, color: '#ffc107' },
    { name: '已接单', value: stats.status_counts?.accepted || 0, color: '#17a2b8' },
    { name: '处理中', value: stats.status_counts?.processing || 0, color: '#007bff' },
    { name: '已完成', value: stats.status_counts?.completed || 0, color: '#28a745' },
    { name: '已关闭', value: stats.status_counts?.closed || 0, color: '#6c757d' },
  ].filter(item => item.value > 0);

  // 准备楼栋分布数据
  const buildingData = stats.building_distribution || [];

  // 准备故障类型数据
  const faultTypeData = stats.fault_type_distribution || [];

  return (
    <div>
      <h1 className="page-title">统计分析</h1>

      {error && <div className="error-message">{error}</div>}

      {/* 统计卡片 */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-value">{stats.total_tickets || 0}</div>
          <div className="stats-label">总工单数</div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #ffc107' }}>
          <div className="stats-value" style={{ color: '#ffc107' }}>
            {stats.status_counts?.pending || 0}
          </div>
          <div className="stats-label">待处理</div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #17a2b8' }}>
          <div className="stats-value" style={{ color: '#17a2b8' }}>
            {(stats.status_counts?.accepted || 0) + (stats.status_counts?.processing || 0)}
          </div>
          <div className="stats-label">处理中</div>
        </div>
        <div className="stats-card" style={{ borderLeft: '4px solid #28a745' }}>
          <div className="stats-value" style={{ color: '#28a745' }}>
            {stats.processing_rate || 0}%
          </div>
          <div className="stats-label">处理率</div>
        </div>
      </div>

      {/* 图表区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {/* 工单状态分布图 */}
        <div className="chart-container">
          <h3 className="chart-title">工单状态分布</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">暂无数据</div>
            </div>
          )}
        </div>

        {/* 楼栋报修分布图 */}
        <div className="chart-container">
          <h3 className="chart-title">各楼栋报修分布</h3>
          {buildingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buildingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="building" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#667eea" name="报修数量">
                  {buildingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-state-icon">🏢</div>
              <div className="empty-state-text">暂无数据</div>
            </div>
          )}
        </div>

        {/* 故障类型统计 */}
        <div className="chart-container" style={{ gridColumn: 'span 2' }}>
          <h3 className="chart-title">故障类型统计</h3>
          {faultTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faultTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#764ba2" name="数量">
                  {faultTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <div className="empty-state-icon">🔧</div>
              <div className="empty-state-text">暂无数据</div>
            </div>
          )}
        </div>
      </div>

      {/* 详细统计表格 */}
      <div className="card">
        <h3 className="detail-section-title" style={{ marginTop: 0 }}>状态详细统计</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>
                  状态
                </th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>
                  数量
                </th>
                <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: 600 }}>
                  占比
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '待处理', value: stats.status_counts?.pending || 0, color: '#ffc107' },
                { name: '已接单', value: stats.status_counts?.accepted || 0, color: '#17a2b8' },
                { name: '处理中', value: stats.status_counts?.processing || 0, color: '#007bff' },
                { name: '已完成', value: stats.status_counts?.completed || 0, color: '#28a745' },
                { name: '已关闭', value: stats.status_counts?.closed || 0, color: '#6c757d' },
              ].map((item, index) => {
                const percentage = stats.total_tickets > 0 
                  ? ((item.value / stats.total_tickets) * 100).toFixed(1) 
                  : 0;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px 15px' }}>
                      <span className={`status-badge status-${
                        item.name === '待处理' ? 'pending' :
                        item.name === '已接单' ? 'accepted' :
                        item.name === '处理中' ? 'processing' :
                        item.name === '已完成' ? 'completed' : 'closed'
                      }`}>
                        {item.name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px', fontWeight: 600 }}>{item.value}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '100px', 
                          height: '8px', 
                          backgroundColor: '#e9ecef',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            backgroundColor: item.color
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
