from flask import Flask
from models import db, User
from werkzeug.security import generate_password_hash
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///repair_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def init_database():
    with app.app_context():
        # 删除现有数据库（如果存在）
        db_path = os.path.join(os.path.dirname(__file__), 'repair_system.db')
        if os.path.exists(db_path):
            os.remove(db_path)
            print("Existing database removed.")
        
        # 创建数据库表
        db.create_all()
        print("Database tables created.")
        
        # 创建管理员账户
        admin = User(
            username='admin',
            password=generate_password_hash('admin123'),
            role='admin',
            name='系统管理员',
            phone='13800138000'
        )
        
        # 创建测试业主账户
        owner1 = User(
            username='owner1',
            password=generate_password_hash('123456'),
            role='owner',
            name='张三',
            phone='13800138001',
            building='1栋',
            room='101'
        )
        
        owner2 = User(
            username='owner2',
            password=generate_password_hash('123456'),
            role='owner',
            name='李四',
            phone='13800138002',
            building='2栋',
            room='202'
        )
        
        db.session.add(admin)
        db.session.add(owner1)
        db.session.add(owner2)
        db.session.commit()
        
        print("Test users created:")
        print("Admin: username=admin, password=admin123")
        print("Owner1: username=owner1, password=123456 (1栋101)")
        print("Owner2: username=owner2, password=123456 (2栋202)")
        print("Database initialization completed.")

if __name__ == '__main__':
    init_database()
