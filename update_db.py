import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(__file__), "fruit_store.db")

def update_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Update unit from 'lb' to 'kg'
    cursor.execute("UPDATE products SET unit = 'kg' WHERE unit = 'lb'")

    # Update prices from USD to IDR (assuming 1 USD = 15000 IDR)
    cursor.execute("UPDATE products SET price = price * 15000")

    conn.commit()
    conn.close()
    print("Database updated: units changed to kg, prices converted to IDR")

if __name__ == '__main__':
    update_db()