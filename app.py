import os
import json
import sqlite3

try:
    from flask import Flask, render_template, request, redirect, url_for, session
except ModuleNotFoundError as exc:
    raise ModuleNotFoundError(
        "Flask tidak ditemukan. Jalankan `pip install Flask` atau `pip install -r requirements.txt` sebelum menjalankan app.py."
    ) from exc

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SECRET_KEY'] = 'fresco_fruits_admin_2026_secret_key'
DB_NAME = os.path.join(os.path.dirname(__file__), "fruit_store.db")

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def format_rupiah(value):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return '-'
    rupiah = "Rp{:,.0f}".format(value).replace(',', '.')
    return rupiah

app.jinja_env.filters['rupiah'] = format_rupiah

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Membuat tabel produk
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            unit TEXT NOT NULL,
            image_url TEXT,
            is_top_pick INTEGER DEFAULT 0,
            is_seasonal INTEGER DEFAULT 0,
            is_new_arrival INTEGER DEFAULT 0,
            is_bestseller INTEGER DEFAULT 0,
            is_deal INTEGER DEFAULT 0
        )
    ''')
    
    # Tambahkan kolom is_new_arrival jika belum ada
    try:
        cursor.execute('ALTER TABLE products ADD COLUMN is_new_arrival INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass  # Kolom sudah ada
    
    # Tambahkan kolom is_bestseller jika belum ada
    try:
        cursor.execute('ALTER TABLE products ADD COLUMN is_bestseller INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass  # Kolom sudah ada
    
    # Tambahkan kolom is_deal jika belum ada
    try:
        cursor.execute('ALTER TABLE products ADD COLUMN is_deal INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass  # Kolom sudah ada
    
    # Membuat tabel orders untuk menyimpan pesanan
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_name TEXT NOT NULL,
            order_email TEXT NOT NULL,
            order_phone TEXT NOT NULL,
            order_address TEXT NOT NULL,
            total_price REAL NOT NULL,
            items_json TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Isi data awal jika tabel masih kosong
    cursor.execute('SELECT count(*) FROM products')
    if cursor.fetchone()[0] == 0:
        products = [
            ('Organic Strawberries', 'Berries', 5.99, 'lb', 'https://pngimg.com/uploads/strawberry/strawberry_PNG2598.png', 1, 0, 0, 0, 0),
            ('Fuji Apples', 'Pomaceous', 3.50, 'ea', 'https://pngimg.com/uploads/apple/apple_PNG12439.png', 1, 0, 0, 0, 0),
            ('Hass Avocados', 'Tropical', 5.99, 'lb', 'https://pngimg.com/uploads/avocado/avocado_PNG15501.png', 1, 0, 0, 0, 0),
            ('Valenica Oranges', 'Citrus', 3.50, 'ea', 'https://pngimg.com/uploads/orange/orange_PNG791.png', 1, 0, 0, 0, 0),
            ('Organic Strawberries', 'Berries', 5.99, 'lb', 'https://pngimg.com/uploads/strawberry/strawberry_PNG2598.png', 0, 1, 0, 0, 0),
            ('Fuji Apples', 'Pomaceous', 3.50, 'ea', 'https://pngimg.com/uploads/apple/apple_PNG12439.png', 0, 1, 0, 0, 0),
            ('Hass Avocados', 'Tropical', 3.50, 'ea', 'https://pngimg.com/uploads/avocado/avocado_PNG15501.png', 0, 1, 0, 0, 0),
            ('Valenica Oranges', 'Citrus', 3.50, 'ea', 'https://pngimg.com/uploads/orange/orange_PNG791.png', 0, 1, 0, 0, 0),
            ('Pineapple', 'Tropical', 4.99, 'ea', 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=400&auto=format&fit=crop', 0, 0, 1, 0, 0),
            ('Blueberries', 'Berries', 6.99, 'lb', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?q=80&w=400&auto=format&fit=crop', 0, 0, 1, 0, 0),
            ('Kiwi', 'Tropical', 2.50, 'ea', 'https://images.unsplash.com/photo-1585059895524-72359e06133a?q=80&w=400&auto=format&fit=crop', 0, 0, 1, 0, 0),
            ('Dragon Fruit', 'Tropical', 7.99, 'ea', 'https://images.unsplash.com/photo-1527325678964-54921661f888?q=80&w=400&auto=format&fit=crop', 0, 0, 1, 0, 0),
            ('Raspberries', 'Berries', 5.50, 'lb', 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?q=80&w=400&auto=format&fit=crop', 0, 0, 1, 0, 0),
            ('Passion Fruit', 'Tropical', 3.99, 'ea', 'https://images.unsplash.com/photo-1591284200880-1ac2c3c7c1a3?q=80&w=400&auto=format&fit=crop', 0, 0, 1, 0, 0),
            ('Mango', 'Tropical', 3.99, 'ea', 'https://pngimg.com/uploads/mango/mango_PNG9187.png', 0, 0, 0, 1, 0),
            ('Grapes', 'Berries', 4.50, 'lb', 'https://pngimg.com/uploads/grapes/grapes_PNG9259.png', 0, 0, 0, 1, 0),
            ('Banana', 'Tropical', 1.99, 'lb', 'https://pngimg.com/uploads/banana/banana_PNG846.png', 0, 0, 0, 1, 0),
            ('Watermelon', 'Melon', 2.99, 'ea', 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?q=80&w=400&auto=format&fit=crop', 0, 0, 0, 0, 1),
            ('Cantaloupe', 'Melon', 3.49, 'ea', 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=400&auto=format&fit=crop', 0, 0, 0, 0, 1),
            ('Peach', 'Stone Fruit', 2.75, 'ea', 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=400&auto=format&fit=crop', 0, 0, 0, 0, 1)
        ]
        cursor.executemany('INSERT INTO products (name, category, price, unit, image_url, is_top_pick, is_seasonal, is_new_arrival, is_bestseller, is_deal) VALUES (?,?,?,?,?,?,?,?,?,?)', products)
        conn.commit()

    cursor.execute("SELECT COUNT(*) FROM products WHERE unit = 'lb'")
    if cursor.fetchone()[0] > 0:
        cursor.execute("UPDATE products SET price = ROUND(price * 15000), unit = 'kg' WHERE unit = 'lb'")
        conn.commit()

    conn.close()

init_db()

@app.route('/')
def index():
    conn = get_db_connection()
    top_picks = conn.execute('SELECT * FROM products WHERE is_top_pick = 1').fetchall()
    seasonal = conn.execute('SELECT * FROM products WHERE is_seasonal = 1').fetchall()
    products = conn.execute('SELECT * FROM products').fetchall()
    new_arrivals = conn.execute('SELECT * FROM products WHERE is_new_arrival = 1').fetchall()
    bestsellers = conn.execute('SELECT * FROM products WHERE is_bestseller = 1').fetchall()
    deals = conn.execute('SELECT * FROM products WHERE is_deal = 1').fetchall()
    conn.close()
    return render_template('index.html', top_picks=top_picks, seasonal=seasonal, products=products, new_arrivals=new_arrivals, bestsellers=bestsellers, deals=deals)

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')
@app.route('/checkout/submit', methods=['POST'])
def checkout_submit():
    order_name = request.form.get('order_name', '').strip()
    order_email = request.form.get('order_email', '').strip()
    order_phone = request.form.get('order_phone', '').strip()
    order_address = request.form.get('order_address', '').strip()
    cart_data_raw = request.form.get('cart_data', '[]')
    try:
        cart_data = json.loads(cart_data_raw)
    except ValueError:
        cart_data = []
    
    # Hitung total harga
    total_price = sum(item.get('price', 0) * item.get('quantity', 0) for item in cart_data)
    
    # Simpan pesanan ke database
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO orders (order_name, order_email, order_phone, order_address, total_price, items_json) VALUES (?, ?, ?, ?, ?, ?)',
        (order_name, order_email, order_phone, order_address, total_price, cart_data_raw)
    )
    conn.commit()
    conn.close()
    
    return render_template('order_confirmation.html', order_name=order_name, order_email=order_email, order_phone=order_phone, order_address=order_address, cart_data=cart_data)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        password = request.form.get('password', '')
        if password == 'fresco2026':  # Password sederhana - bisa diganti
            session['admin_logged_in'] = True
            return redirect(url_for('admin'))
        else:
            return render_template('admin_login.html', error='Password salah')
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    
    conn = get_db_connection()
    product_to_edit = None

    if request.method == 'POST':
        product_id = request.form.get('product_id')
        name = request.form.get('name', '').strip()
        category = request.form.get('category', '').strip()
        try:
            price = float(request.form.get('price', '0').strip())
        except ValueError:
            price = 0.0
        unit = request.form.get('unit', '').strip() or 'pcs'
        image_url = request.form.get('image_url', '').strip() or 'https://via.placeholder.com/400x300?text=Produk+Tanpa+Gambar'
        is_top_pick = 1 if request.form.get('is_top_pick') else 0
        is_seasonal = 1 if request.form.get('is_seasonal') else 0
        is_new_arrival = 1 if request.form.get('is_new_arrival') else 0
        is_bestseller = 1 if request.form.get('is_bestseller') else 0
        is_deal = 1 if request.form.get('is_deal') else 0

        if product_id:
            conn.execute(
                'UPDATE products SET name = ?, category = ?, price = ?, unit = ?, image_url = ?, is_top_pick = ?, is_seasonal = ?, is_new_arrival = ?, is_bestseller = ?, is_deal = ? WHERE id = ?',
                (name, category, price, unit, image_url, is_top_pick, is_seasonal, is_new_arrival, is_bestseller, is_deal, product_id)
            )
        else:
            conn.execute(
                'INSERT INTO products (name, category, price, unit, image_url, is_top_pick, is_seasonal, is_new_arrival, is_bestseller, is_deal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (name, category, price, unit, image_url, is_top_pick, is_seasonal, is_new_arrival, is_bestseller, is_deal)
            )
        conn.commit()
        conn.close()
        return redirect(url_for('admin'))

    edit_id = request.args.get('edit')
    if edit_id:
        product_to_edit = conn.execute('SELECT * FROM products WHERE id = ?', (edit_id,)).fetchone()

    products = conn.execute('SELECT * FROM products ORDER BY id DESC').fetchall()
    
    # Ambil statistik penjualan
    orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    total_orders = len(orders)
    total_revenue = sum(o['total_price'] for o in orders) if orders else 0
    
    conn.close()
    return render_template('admin.html', products=products, product_to_edit=product_to_edit, orders=orders, total_orders=total_orders, total_revenue=total_revenue)

@app.route('/admin/delete/<int:product_id>', methods=['POST'])
def delete_product(product_id):
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    
    conn = get_db_connection()
    conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('admin'))

if __name__ == '__main__':
    app.run(debug=True)