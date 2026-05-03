from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, RepairTicket, TicketImage, TicketLog
from datetime import datetime, timedelta
import os
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///repair_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

CORS(app)
db.init_app(app)

# 创建上传目录
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# 静态文件路由 - 用于访问上传的图片
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 故障类型列表
FAULT_TYPES = [
    '水电维修',
    '家电维修',
    '门窗维修',
    '墙面地面',
    '管道疏通',
    '其他问题'
]

# 工单状态列表
TICKET_STATUSES = [
    'pending',   # 待处理
    'accepted',  # 已接单
    'processing', # 处理中
    'completed',  # 已完成
    'closed'      # 已关闭
]

# 状态名称映射
STATUS_NAMES = {
    'pending': '待处理',
    'accepted': '已接单',
    'processing': '处理中',
    'completed': '已完成',
    'closed': '已关闭'
}

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    
    if not user or not check_password_hash(user.password, data.get('password')):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'name': user.name,
        'role': user.role,
        'phone': user.phone,
        'building': user.building,
        'room': user.room
    }), 200

@app.route('/api/users', methods=['POST'])
def register():
    data = request.json
    
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    user = User(
        username=data.get('username'),
        password=generate_password_hash(data.get('password')),
        role=data.get('role', 'owner'),
        name=data.get('name'),
        phone=data.get('phone'),
        building=data.get('building'),
        room=data.get('room')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'name': user.name,
        'role': user.role
    }), 201

@app.route('/api/tickets', methods=['POST'])
def create_ticket():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': '需要登录才能提交报修'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    # 生成工单标题
    title = f"{data.get('building')}{data.get('room')} - {data.get('fault_type')}"
    
    ticket = RepairTicket(
        title=title,
        description=data.get('description'),
        fault_type=data.get('fault_type'),
        building=data.get('building'),
        room=data.get('room'),
        owner_id=user_id
    )
    
    db.session.add(ticket)
    db.session.flush()
    
    # 添加日志
    log = TicketLog(
        ticket_id=ticket.id,
        user_id=user_id,
        action='create',
        comment='业主提交报修申请'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'id': ticket.id,
        'title': ticket.title,
        'status': ticket.status,
        'created_at': ticket.created_at.isoformat()
    }), 201

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    user_id = request.args.get('user_id')
    role = request.args.get('role')
    building = request.args.get('building')
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = RepairTicket.query
    
    # 业主只能查看自己的工单
    if role == 'owner' and user_id:
        query = query.filter_by(owner_id=user_id)
    
    # 按楼栋筛选
    if building:
        query = query.filter_by(building=building)
    
    # 按状态筛选
    if status:
        query = query.filter_by(status=status)
    
    # 按时间范围筛选
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(RepairTicket.created_at >= start)
    if end_date:
        end = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.filter(RepairTicket.created_at < end)
    
    # 按创建时间倒序排列
    query = query.order_by(RepairTicket.created_at.desc())
    
    tickets = query.all()
    
    result = []
    for ticket in tickets:
        owner = User.query.get(ticket.owner_id)
        assignee = User.query.get(ticket.assignee_id) if ticket.assignee_id else None
        
        # 将图片路径转换为可访问的URL
        images = []
        for img in ticket.images:
            # 检查是否已经是URL格式（以/开头）
            if img.image_path.startswith('/'):
                image_url = img.image_path
            else:
                # 从路径中提取文件名（处理可能包含目录的情况）
                # 支持Windows路径（\）和Unix路径（/）
                filename = os.path.basename(img.image_path.replace('\\', '/'))
                image_url = f'/uploads/{filename}'
            images.append({'id': img.id, 'path': image_url})
        
        result.append({
            'id': ticket.id,
            'title': ticket.title,
            'description': ticket.description,
            'fault_type': ticket.fault_type,
            'building': ticket.building,
            'room': ticket.room,
            'status': ticket.status,
            'status_name': STATUS_NAMES.get(ticket.status, ticket.status),
            'owner_name': owner.name if owner else '',
            'owner_phone': owner.phone if owner else '',
            'assignee_name': assignee.name if assignee else '',
            'assignee_phone': assignee.phone if assignee else '',
            'created_at': ticket.created_at.isoformat() if ticket.created_at else None,
            'updated_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
            'completed_at': ticket.completed_at.isoformat() if ticket.completed_at else None,
            'images': images
        })
    
    return jsonify(result), 200

@app.route('/api/tickets/<int:ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    ticket = RepairTicket.query.get(ticket_id)
    
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    owner = User.query.get(ticket.owner_id)
    assignee = User.query.get(ticket.assignee_id) if ticket.assignee_id else None
    
    # 获取工单日志
    logs = []
    for log in ticket.logs:
        log_user = User.query.get(log.user_id)
        logs.append({
            'id': log.id,
            'user_name': log_user.name if log_user else '',
            'action': log.action,
            'comment': log.comment,
            'created_at': log.created_at.isoformat() if log.created_at else None
        })
    
    # 获取图片 - 将路径转换为可访问的URL
    images = []
    for img in ticket.images:
        # 检查是否已经是URL格式（以/开头）
        if img.image_path.startswith('/'):
            image_url = img.image_path
        else:
            image_url = f'/uploads/{img.image_path}'
        images.append({'id': img.id, 'path': image_url})
    
    result = {
        'id': ticket.id,
        'title': ticket.title,
        'description': ticket.description,
        'fault_type': ticket.fault_type,
        'building': ticket.building,
        'room': ticket.room,
        'status': ticket.status,
        'status_name': STATUS_NAMES.get(ticket.status, ticket.status),
        'owner_name': owner.name if owner else '',
        'owner_phone': owner.phone if owner else '',
        'assignee_name': assignee.name if assignee else '',
        'assignee_phone': assignee.phone if assignee else '',
        'created_at': ticket.created_at.isoformat() if ticket.created_at else None,
        'updated_at': ticket.updated_at.isoformat() if ticket.updated_at else None,
        'completed_at': ticket.completed_at.isoformat() if ticket.completed_at else None,
        'logs': logs,
        'images': images
    }
    
    return jsonify(result), 200

@app.route('/api/tickets/<int:ticket_id>/accept', methods=['POST'])
def accept_ticket(ticket_id):
    data = request.json
    user_id = data.get('user_id')
    role = data.get('role')
    
    if role != 'admin':
        return jsonify({'error': '只有管理员才能接单'}), 403
    
    ticket = RepairTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    if ticket.status != 'pending':
        return jsonify({'error': '只能接收待处理的工单'}), 400
    
    ticket.status = 'accepted'
    ticket.assignee_id = user_id
    
    # 添加日志
    log = TicketLog(
        ticket_id=ticket.id,
        user_id=user_id,
        action='accept',
        comment='管理员已接单'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'message': '接单成功', 'status': ticket.status}), 200

@app.route('/api/tickets/<int:ticket_id>/assign', methods=['POST'])
def assign_ticket(ticket_id):
    data = request.json
    user_id = data.get('user_id')
    role = data.get('role')
    assignee_name = data.get('assignee_name')
    assignee_phone = data.get('assignee_phone')
    
    if role != 'admin':
        return jsonify({'error': '只有管理员才能指定责任人'}), 403
    
    ticket = RepairTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    # 查找或创建责任人
    assignee = User.query.filter_by(name=assignee_name, role='admin').first()
    if not assignee:
        # 创建新的管理员账户
        assignee = User(
            username=f"worker_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            password=generate_password_hash('123456'),
            role='admin',
            name=assignee_name,
            phone=assignee_phone
        )
        db.session.add(assignee)
        db.session.flush()
    
    ticket.status = 'processing'
    ticket.assignee_id = assignee.id
    
    # 添加日志
    log = TicketLog(
        ticket_id=ticket.id,
        user_id=user_id,
        action='assign',
        comment=f'指定责任人：{assignee_name}'
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'message': '指定责任人成功', 'status': ticket.status}), 200

@app.route('/api/tickets/<int:ticket_id>/progress', methods=['POST'])
def update_progress(ticket_id):
    data = request.json
    user_id = data.get('user_id')
    comment = data.get('comment')
    role = data.get('role')
    
    ticket = RepairTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    # 业主可以更新自己工单的进度（实际上主要是管理员更新）
    if role == 'owner' and ticket.owner_id != int(user_id):
        return jsonify({'error': '无权操作此工单'}), 403
    
    # 添加日志
    log = TicketLog(
        ticket_id=ticket.id,
        user_id=user_id,
        action='progress',
        comment=comment
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'message': '进度更新成功'}), 200

@app.route('/api/tickets/<int:ticket_id>/complete', methods=['POST'])
def complete_ticket(ticket_id):
    data = request.json
    user_id = data.get('user_id')
    role = data.get('role')
    comment = data.get('comment', '工单已完成')
    
    if role != 'admin':
        return jsonify({'error': '只有管理员才能标记完成'}), 403
    
    ticket = RepairTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    if ticket.status not in ['accepted', 'processing']:
        return jsonify({'error': '只能标记已接单或处理中的工单为完成'}), 400
    
    ticket.status = 'completed'
    ticket.completed_at = datetime.utcnow()
    
    # 添加日志
    log = TicketLog(
        ticket_id=ticket.id,
        user_id=user_id,
        action='complete',
        comment=comment
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'message': '工单已完成', 'status': ticket.status}), 200

@app.route('/api/tickets/<int:ticket_id>/close', methods=['POST'])
def close_ticket(ticket_id):
    data = request.json
    user_id = data.get('user_id')
    role = data.get('role')
    comment = data.get('comment', '工单已关闭')
    
    if role != 'admin':
        return jsonify({'error': '只有管理员才能关闭工单'}), 403
    
    ticket = RepairTicket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': '工单不存在'}), 404
    
    ticket.status = 'closed'
    
    # 添加日志
    log = TicketLog(
        ticket_id=ticket.id,
        user_id=user_id,
        action='close',
        comment=comment
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({'message': '工单已关闭', 'status': ticket.status}), 200

@app.route('/api/tickets/<int:ticket_id>/images', methods=['POST'])
def upload_image(ticket_id):
    if 'image' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    if file:
        # 生成唯一文件名
        filename = f"{ticket_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 保存到数据库 - 存储相对路径
        image = TicketImage(
            ticket_id=ticket_id,
            image_path=filename  # 只存储文件名，不存储完整路径
        )
        db.session.add(image)
        db.session.commit()
        
        # 返回可访问的URL
        image_url = f'/uploads/{filename}'
        return jsonify({'message': '图片上传成功', 'id': image.id, 'path': image_url}), 201
    
    return jsonify({'error': '文件上传失败'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    role = request.args.get('role')
    
    if role != 'admin':
        return jsonify({'error': '只有管理员才能查看统计信息'}), 403
    
    # 总工单数量
    total_tickets = RepairTicket.query.count()
    
    # 各状态工单数量
    status_counts = {}
    for status in TICKET_STATUSES:
        count = RepairTicket.query.filter_by(status=status).count()
        status_counts[status] = count
        status_counts[f"{status}_name"] = STATUS_NAMES.get(status, status)
    
    # 处理率（已完成和已关闭的工单占比）
    processed = status_counts.get('completed', 0) + status_counts.get('closed', 0)
    processing_rate = (processed / total_tickets * 100) if total_tickets > 0 else 0
    
    # 各楼栋报修分布
    building_stats = db.session.query(
        RepairTicket.building,
        db.func.count(RepairTicket.id).label('count')
    ).group_by(RepairTicket.building).all()
    
    building_distribution = [{'building': bs.building, 'count': bs.count} for bs in building_stats]
    
    # 各故障类型统计
    fault_type_stats = db.session.query(
        RepairTicket.fault_type,
        db.func.count(RepairTicket.id).label('count')
    ).group_by(RepairTicket.fault_type).all()
    
    fault_type_distribution = [{'type': fts.fault_type, 'count': fts.count} for fts in fault_type_stats]
    
    return jsonify({
        'total_tickets': total_tickets,
        'status_counts': status_counts,
        'processing_rate': round(processing_rate, 2),
        'building_distribution': building_distribution,
        'fault_type_distribution': fault_type_distribution
    }), 200

@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    # 获取所有楼栋
    buildings = db.session.query(RepairTicket.building).distinct().all()
    building_list = [b.building for b in buildings]
    
    # 如果没有数据，返回默认楼栋
    if not building_list:
        building_list = ['1栋', '2栋', '3栋', '4栋', '5栋']
    
    return jsonify(building_list), 200

@app.route('/api/fault-types', methods=['GET'])
def get_fault_types():
    return jsonify(FAULT_TYPES), 200

@app.route('/api/statuses', methods=['GET'])
def get_statuses():
    return jsonify([{'value': s, 'name': STATUS_NAMES.get(s, s)} for s in TICKET_STATUSES]), 200

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'name': user.name,
        'role': user.role,
        'phone': user.phone,
        'building': user.building,
        'room': user.room
    }), 200

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    data = request.json
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    if data.get('name'):
        user.name = data.get('name')
    if data.get('phone'):
        user.phone = data.get('phone')
    if data.get('building'):
        user.building = data.get('building')
    if data.get('room'):
        user.room = data.get('room')
    if data.get('password'):
        user.password = generate_password_hash(data.get('password'))
    
    db.session.commit()
    
    return jsonify({'message': '用户信息更新成功'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
