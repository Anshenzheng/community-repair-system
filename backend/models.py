from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='owner')
    name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(20))
    building = db.Column(db.String(20))
    room = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    owned_tickets = db.relationship('RepairTicket', backref='owner', lazy=True, foreign_keys='RepairTicket.owner_id')
    assigned_tickets = db.relationship('RepairTicket', backref='assignee_user', lazy=True, foreign_keys='RepairTicket.assignee_id')

class RepairTicket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    fault_type = db.Column(db.String(50), nullable=False)
    building = db.Column(db.String(20), nullable=False)
    room = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='pending')
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    images = db.relationship('TicketImage', backref='ticket', lazy=True, cascade='all, delete-orphan')
    logs = db.relationship('TicketLog', backref='ticket', lazy=True, cascade='all, delete-orphan')
    assignee = db.relationship('User', foreign_keys=[assignee_id], overlaps="assignee_user,assigned_tickets")

class TicketImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('repair_ticket.id'), nullable=False)
    image_path = db.Column(db.String(200), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

class TicketLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('repair_ticket.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='ticket_logs')
