import sqlite3
import os

# Relative path from project root
db_path = os.path.join('backend', 'db.sqlite3')

def inspect():
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print("--- Tables found in database ---")
        for t in tables:
            print(f"- {t[0]}")
        print("\n")

        # Try to find the words table
        target_table = None
        for t in tables:
            if 'sortonym' in t[0].lower() and 'word' in t[0].lower():
                target_table = t[0]
                break
        
        if not target_table:
            target_table = tables[0][0] if tables else None

        if target_table:
            print(f"--- Rows in table: {target_table} ---")
            cursor.execute(f"SELECT id, word, SUBSTR(synonyms, 1, 30) || '...' FROM {target_table} LIMIT 10")
            rows = cursor.fetchall()
            
            # Simple header
            print(f"{'ID':<4} | {'Word':<15} | {'Synonyms (Preview)':<40}")
            print("-" * 65)
            
            for row in rows:
                id_val, word, syns = row
                print(f"{id_val:<4} | {word:<15} | {str(syns):<40}")
        else:
            print("No suitable table found to display.")

        conn.close()
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    inspect()
