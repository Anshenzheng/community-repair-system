import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function TicketDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 模态框状态
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  
  // 表单状态
  const [assigneeName, setAssigneeName] = useState('');
  const [assigneePhone, setAssigneePhone] = useState('');
  const [progressComment, setProgressComment] = useState('');
  const [closeComment, setCloseComment] = useState('');
  
  // 图片预览状态
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`/api/tickets/${id}`);
      setTicket(response.data);
    } catch (err) {
      setError('获取工单详情失败');
      console.error('获取工单详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await axios.post(`/api/tickets/${id}/accept`, {
        user_id: user.id,
        role: user.role
      });
      setSuccess('接单成功！');
      setTimeout(() => {
        setSuccess('');
        fetchTicket();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || '接单失败');
    }
  };

  const handleAssign = async () => {
    if (!assigneeName) {
      setError('请输入责任人姓名');
      return;
    }
    
    try {
      await axios.post(`/api/tickets/${id}/assign`, {
        user_id: user.id,
        role: user.role,
        assignee_name: assigneeName,
        assignee_phone: assigneePhone
      });
      setShowAssignModal(false);
      setAssigneeName('');
      setAssigneePhone('');
      setSuccess('指定责任人成功！');
      setTimeout(() => {
        setSuccess('');
        fetchTicket();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || '指定责任人失败');
    }
  };

  const handleProgress = async () => {
    if (!progressComment) {
      setError('请输入进度说明');
      return;
    }
    
    try {
      await axios.post(`/api/tickets/${id}/progress`, {
        user_id: user.id,
        role: user.role,
        comment: progressComment
      });
      setShowProgressModal(false);
      setProgressComment('');
      setSuccess('进度更新成功！');
      setTimeout(() => {
        setSuccess('');
        fetchTicket();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || '更新进度失败');
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post(`/api/tickets/${id}/complete`, {
        user_id: user.id,
        role: user.role
      });
      setSuccess('工单已完成！');
      setTimeout(() => {
        setSuccess('');
        fetchTicket();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || '标记完成失败');
    }
  };

  const handleClose = async () => {
    try {
      await axios.post(`/api/tickets/${id}/close`, {
        user_id: user.id,
        role: user.role,
        comment: closeComment || '工单已关闭'
      });
      setShowCloseModal(false);
      setCloseComment('');
      setSuccess('工单已关闭！');
      setTimeout(() => {
        setSuccess('');
        fetchTicket();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || '关闭工单失败');
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      create: '📝',
      accept: '📋',
      assign: '👤',
      progress: '🚀',
      complete: '✅',
      close: '🔒'
    };
    return icons[action] || '📄';
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!ticket) {
    return (
      <div className="card">
        <div className="error-message">工单不存在</div>
        <button className="btn btn-primary" onClick={() => navigate('/tickets')}>
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          工单详情
          <span style={{ fontSize: '14px', color: '#999', marginLeft: '10px' }}>
            #{ticket.id}
          </span>
        </h1>
        <button className="btn btn-secondary" onClick={() => navigate('/tickets')}>
          ← 返回列表
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h2 style={{ color: '#333', margin: 0 }}>{ticket.title}</h2>
          <span className={`status-badge status-${ticket.status}`}>
            {ticket.status_name}
          </span>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">基本信息</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div className="detail-row">
              <span className="detail-label">故障类型：</span>
              <span className="detail-value">{ticket.fault_type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">房屋位置：</span>
              <span className="detail-value">{ticket.building}{ticket.room}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">业主姓名：</span>
              <span className="detail-value">{ticket.owner_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">联系电话：</span>
              <span className="detail-value">{ticket.owner_phone || '未填写'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">责任人：</span>
              <span className="detail-value">{ticket.assignee_name || '未分配'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">提交时间：</span>
              <span className="detail-value">
                {new Date(ticket.created_at).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">问题描述</h3>
          <p style={{ color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </p>
        </div>

        {ticket.images && ticket.images.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title">图片附件（点击图片可放大查看）</h3>
            <div className="image-grid">
              {ticket.images.map((img, index) => (
                <div 
                  key={img.id} 
                  className="image-item"
                  onClick={() => setPreviewImage({ path: img.path, index: index + 1 })}
                >
                  <img
                    src={img.path}
                    alt={`图片 ${index + 1}`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '🖼️';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 图片预览模态框 */}
        {previewImage && (
          <div 
            className="image-preview-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setPreviewImage(null);
              }
            }}
          >
            <div className="image-preview-container">
              <button 
                className="image-preview-close"
                onClick={() => setPreviewImage(null)}
              >
                ×
              </button>
              <img
                src={previewImage.path}
                alt={`图片 ${previewImage.index}`}
              />
              <div className="image-preview-info">
                图片 {previewImage.index}
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {user.role === 'admin' && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
            {ticket.status === 'pending' && (
              <button className="btn btn-primary" onClick={handleAccept}>
                📋 接单
              </button>
            )}
            {(ticket.status === 'pending' || ticket.status === 'accepted') && (
              <button className="btn btn-warning" onClick={() => setShowAssignModal(true)}>
                👤 指定责任人
              </button>
            )}
            {(ticket.status === 'accepted' || ticket.status === 'processing') && (
              <button className="btn btn-secondary" onClick={() => setShowProgressModal(true)}>
                📝 更新进度
              </button>
            )}
            {(ticket.status === 'accepted' || ticket.status === 'processing') && (
              <button className="btn btn-success" onClick={handleComplete}>
                ✅ 标记完成
              </button>
            )}
            {ticket.status !== 'closed' && (
              <button className="btn btn-danger" onClick={() => setShowCloseModal(true)}>
                🔒 关闭工单
              </button>
            )}
          </div>
        )}
      </div>

      {/* 处理日志 */}
      <div className="card">
        <h3 className="detail-section-title" style={{ marginTop: 0 }}>处理日志</h3>
        {ticket.logs && ticket.logs.length > 0 ? (
          <div className="log-list">
            {ticket.logs.map(log => (
              <div key={log.id} className="log-item">
                <div className="log-icon">
                  {getActionIcon(log.action)}
                </div>
                <div className="log-content">
                  <div className="log-header">
                    <span className="log-user">{log.user_name}</span>
                    <span className="log-time">
                      {new Date(log.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="log-comment">{log.comment}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '30px' }}>
            <div className="empty-state-icon" style={{ fontSize: '48px' }}>📝</div>
            <div className="empty-state-text">暂无处理记录</div>
          </div>
        )}
      </div>

      {/* 指定责任人模态框 */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">指定责任人</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">责任人姓名 *</label>
                <input
                  type="text"
                  className="form-control"
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  placeholder="请输入责任人姓名"
                />
              </div>
              <div className="form-group">
                <label className="form-label">联系电话</label>
                <input
                  type="text"
                  className="form-control"
                  value={assigneePhone}
                  onChange={(e) => setAssigneePhone(e.target.value)}
                  placeholder="请输入联系电话"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAssign}>
                确认指定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 更新进度模态框 */}
      {showProgressModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">更新处理进度</h3>
              <button className="modal-close" onClick={() => setShowProgressModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">进度说明 *</label>
                <textarea
                  className="form-control"
                  value={progressComment}
                  onChange={(e) => setProgressComment(e.target.value)}
                  placeholder="请输入处理进度说明..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProgressModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleProgress}>
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关闭工单模态框 */}
      {showCloseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">关闭工单</h3>
              <button className="modal-close" onClick={() => setShowCloseModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">关闭原因</label>
                <textarea
                  className="form-control"
                  value={closeComment}
                  onChange={(e) => setCloseComment(e.target.value)}
                  placeholder="请输入关闭原因（可选）..."
                  rows={3}
                />
              </div>
              <p style={{ color: '#666', fontSize: '14px' }}>
                确定要关闭此工单吗？关闭后将无法继续处理。
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={handleClose}>
                确认关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
