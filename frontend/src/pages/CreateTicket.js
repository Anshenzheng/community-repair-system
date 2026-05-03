import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateTicket({ user }) {
  const navigate = useNavigate();
  const [building, setBuilding] = useState(user.building || '');
  const [room, setRoom] = useState(user.room || '');
  const [faultType, setFaultType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [faultTypes, setFaultTypes] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFaultTypes();
    fetchBuildings();
  }, []);

  const fetchFaultTypes = async () => {
    try {
      const response = await axios.get('/api/fault-types');
      setFaultTypes(response.data);
    } catch (err) {
      console.error('获取故障类型失败:', err);
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('最多只能上传5张图片');
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!building || !room || !faultType || !description) {
      setError('请填写所有必填项');
      return;
    }

    setLoading(true);

    try {
      // 先创建工单
      const ticketResponse = await axios.post('/api/tickets', {
        user_id: user.id,
        building,
        room,
        fault_type: faultType,
        description
      });

      const ticketId = ticketResponse.data.id;

      // 上传图片
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append('image', images[i]);
        
        try {
          await axios.post(`/api/tickets/${ticketId}/images`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } catch (imgErr) {
          console.error('图片上传失败:', imgErr);
        }
      }

      setSuccess('报修提交成功！');
      setTimeout(() => {
        navigate('/tickets');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">提交报修</h1>
      
      <div className="card">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">楼栋 *</label>
              <select
                className="form-control"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                required
              >
                <option value="">请选择楼栋</option>
                {buildings.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">房号 *</label>
              <input
                type="text"
                className="form-control"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="请输入房号，如：101"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">故障类型 *</label>
            <select
              className="form-control"
              value={faultType}
              onChange={(e) => setFaultType(e.target.value)}
              required
            >
              <option value="">请选择故障类型</option>
              {faultTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">问题描述 *</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述您遇到的问题..."
              rows={5}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">上传图片（可选，最多5张）</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={{ padding: '10px' }}
            />
            
            {images.length > 0 && (
              <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {images.map((img, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <div className="image-item">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`预览 ${index + 1}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#dc3545',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '提交中...' : '提交报修'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/tickets')}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;
