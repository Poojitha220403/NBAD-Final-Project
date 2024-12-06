from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies, get_jwt
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
import mysql.connector
from mysql.connector import pooling
import json
from dotenv import load_dotenv
import os
import hashlib

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)

# MySQL Configuration
db_config = {
    'pool_name': 'mypool',
    'pool_size': 5,
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

# Create connection pool
connection_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)

def get_db_connection():
    return connection_pool.get_connection()

def convert_to_html(content_json):
    """Convert Draft.js JSON to basic HTML"""
    try:
        content_dict = json.loads(content_json)
        html = []
        
        for block in content_dict['blocks']:
            text = block['text']
            block_type = block['type']
            styles = block['inlineStyleRanges']
            
            if styles:
                for style in sorted(styles, key=lambda x: x['offset'], reverse=True):
                    start = style['offset']
                    end = start + style['length']
                    style_type = style['style']
                    
                    if style_type == 'BOLD':
                        text = f"{text[:start]}<strong>{text[start:end]}</strong>{text[end:]}"
                    elif style_type == 'ITALIC':
                        text = f"{text[:start]}<em>{text[start:end]}</em>{text[end:]}"
                    elif style_type == 'UNDERLINE':
                        text = f"{text[:start]}<u>{text[start:end]}</u>{text[end:]}"
                    elif style_type == 'STRIKETHROUGH':
                        text = f"{text[:start]}<del>{text[start:end]}</del>{text[end:]}"
            
            if block_type == 'unstyled':
                html.append(f"<p>{text}</p>")
            elif block_type == 'ordered-list-item':
                html.append(f"<li>{text}</li>")
                
        return "".join(html)
    except Exception as e:
        print(f"Error converting content to HTML: {e}")
        return ""

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"msg": "Missing username or password"}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (data['username'],))
        user = cursor.fetchone()
        
        if user:
            hashed_password = hashlib.sha512(data['password'].encode('utf-8')).hexdigest()
            print(f"Hashed password: {hashed_password}")
            print(f"Database password: {user['password']}")
            if user['password'] == hashed_password:
                access_token = create_access_token(identity=user['username'])
                return jsonify(access_token=access_token)
        return jsonify({"msg": "Bad username or password"}), 401
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get dashboard content ordered by order_id
        cursor.execute("""
            SELECT * FROM content 
            WHERE page_type = 'dashboard'
            ORDER BY order_id
        """)
        contents = cursor.fetchall()
        
        return jsonify({
            "logged_in_as": get_jwt_identity(),
            "contents": contents
        }), 200
        
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all content and charts for summary page ordered by order_id
        cursor.execute("""
            SELECT * FROM content 
            WHERE page_type = 'summary'
            ORDER BY order_id
        """)
        contents = cursor.fetchall()
        
        cursor.execute("""
            SELECT * FROM charts
            WHERE page_type = 'summary'
            ORDER BY order_id
        """)
        charts = cursor.fetchall()
        
        # Combine content and charts based on order_id
        items = []
        content_idx = 0
        chart_idx = 0
        
        while content_idx < len(contents) or chart_idx < len(charts):
            if content_idx < len(contents) and (chart_idx >= len(charts) or 
                contents[content_idx]['order_id'] <= charts[chart_idx]['order_id']):
                items.append({
                    'type': 'content',
                    'data': contents[content_idx]
                })
                content_idx += 1
            else:
                items.append({
                    'type': 'chart',
                    'data': charts[chart_idx]
                })
                chart_idx += 1
        
        return jsonify({
            "items": items
        }), 200
        
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/reports', methods=['GET'])
@jwt_required()
def reports():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all content and charts for reports page ordered by order_id
        cursor.execute("""
            SELECT * FROM content 
            WHERE page_type = 'reports'
            ORDER BY order_id
        """)
        contents = cursor.fetchall()
        
        cursor.execute("""
            SELECT * FROM charts
            WHERE page_type = 'reports'
            ORDER BY order_id
        """)
        charts = cursor.fetchall()
        
        # Combine content and charts based on order_id
        items = []
        content_idx = 0
        chart_idx = 0
        
        while content_idx < len(contents) or chart_idx < len(charts):
            if content_idx < len(contents) and (chart_idx >= len(charts) or 
                contents[content_idx]['order_id'] <= charts[chart_idx]['order_id']):
                items.append({
                    'type': 'content',
                    'data': contents[content_idx]
                })
                content_idx += 1
            else:
                items.append({
                    'type': 'chart',
                    'data': charts[chart_idx]
                })
                chart_idx += 1
        
        return jsonify({
            "items": items
        }), 200
        
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()
        
  
@app.route('/')
def home():
    return jsonify({"msg": "Welcome to P75 Backend!"})

# Admin Routes
@app.route('/admin/contents/<page_type>', methods=['GET'])
@jwt_required()
def get_contents(page_type):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM content 
            WHERE page_type = %s 
            ORDER BY order_id
        """, (page_type,))
        contents = cursor.fetchall()
        return jsonify(contents)
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/charts/<page_type>', methods=['GET'])
@jwt_required()
def get_charts(page_type):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM charts 
            WHERE page_type = %s 
            ORDER BY order_id
        """, (page_type,))
        charts = cursor.fetchall()
        return jsonify(charts)
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/add_content', methods=['POST'])
@jwt_required()
def add_content():
    data = request.get_json()
    page_type = data.get('page_type')
    content = data.get('content')
    order_id = data.get('order_id')
    
    if not all([page_type, content, order_id]):
        return jsonify({"msg": "Missing required fields"}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        html_content = convert_to_html(content)
        cursor.execute("""
            INSERT INTO content (page_type, content, html_content, order_id) 
            VALUES (%s, %s, %s, %s)
        """, (page_type, content, html_content, order_id))
        
        conn.commit()
        return jsonify({"msg": "Content added successfully"}), 201
    except Exception as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()
        
@app.route('/admin/add_chart', methods=['POST'])
@jwt_required()
def add_chart():
    data = request.get_json()
    page_type = data.get('page_type')
    chart_type = data.get('chart_type')
    chart_data = data.get('chart_data')
    order_id = data.get('order_id')
    
    if not all([page_type, chart_type, chart_data, order_id]):
        return jsonify({"msg": "Missing required fields"}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO charts (page_type, chart_type, chart_data, order_id) 
            VALUES (%s, %s, %s, %s)
        """, (page_type, chart_type, json.dumps(chart_data), order_id))
        
        conn.commit()
        return jsonify({"msg": "Chart added successfully"}), 201
    except Exception as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/content/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_content(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM content WHERE id = %s", (id,))
            conn.commit()
            return jsonify({"msg": "Content deleted successfully"})
            
        data = request.get_json()
        content = data.get('content')
        page_type = data.get('page_type')
        order_id = data.get('order_id')
        
        if not all([content, page_type, order_id]):
            return jsonify({"msg": "Missing required fields"}), 400
            
        html_content = convert_to_html(content)
        cursor.execute("""
            UPDATE content 
            SET content = %s, html_content = %s, page_type = %s, order_id = %s 
            WHERE id = %s
        """, (content, html_content, page_type, order_id, id))
        
        conn.commit()
        return jsonify({"msg": "Content updated successfully"})
    except Exception as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/chart/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_chart(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if request.method == 'DELETE':
            cursor.execute("DELETE FROM charts WHERE id = %s", (id,))
            conn.commit()
            return jsonify({"msg": "Chart deleted successfully"})
            
        data = request.get_json()
        chart_type = data.get('chart_type')
        chart_data = data.get('chart_data')
        page_type = data.get('page_type')
        order_id = data.get('order_id')
        
        if not all([chart_type, chart_data, page_type, order_id]):
            return jsonify({"msg": "Missing required fields"}), 400
            
        cursor.execute("""
            UPDATE charts 
            SET chart_type = %s, chart_data = %s, page_type = %s, order_id = %s 
            WHERE id = %s
        """, (chart_type, json.dumps(chart_data), page_type, order_id, id))
        
        conn.commit()
        return jsonify({"msg": "Chart updated successfully"})
    except Exception as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({"msg": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print(f"Initializing database: {os.getenv('DB_NAME')}")
        
        # Create database if not exists
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {os.getenv('DB_NAME')}")
        cursor.execute(f"USE {os.getenv('DB_NAME')}")
        
        print("Creating users table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(80) UNIQUE NOT NULL,
                password VARCHAR(257) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("Creating content table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                page_type ENUM('dashboard', 'summary', 'reports') NOT NULL,
                content TEXT NOT NULL,
                html_content TEXT NOT NULL,
                order_id INT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_page_order (page_type, order_id)
            )
        """)
        
        print("Creating charts table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS charts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                page_type ENUM('summary', 'reports') NOT NULL,
                chart_type VARCHAR(50) NOT NULL,
                chart_data LONGTEXT NOT NULL,
                order_id INT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_page_order (page_type, order_id)
            )
        """)
        
        conn.commit()
        
        print("Checking for default user...")
        cursor.execute("SELECT * FROM users WHERE username = 'poojitha'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", ('poojitha', '88f1dc4551050f9e4261b71e2b151910593ed2bed6e6ce4646f5f68e4b24d9c1b48fab0318dffa725c132a47105d681b625f36d106dc715fd34028fc6a4c11bc'))
            conn.commit()
            print("Default user created successfully")
        
        print("Database initialization completed successfully")
            
    except mysql.connector.Error as err:
        print(f"MySQL Error: {err}")
        print(f"Error Code: {err.errno}")
        print(f"SQLSTATE: {err.sqlstate}")
        print(f"Message: {err.msg}")
    except Exception as e:
        print(f"General error during database initialization: {e}")
    finally:
        cursor.close()
        conn.close()
        
    app.run(host="0.0.0.0",port=3000)