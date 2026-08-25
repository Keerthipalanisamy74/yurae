import os
import sys
import sqlite3
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.database.session import Base, engine as mysql_engine
import app.models.models


def sync_db_files():
    project_root = backend_dir.parent
    db_dir = project_root / "db"
    db_dir.mkdir(exist_ok=True)

    sqlite_file = db_dir / "yuraedb.sqlite3"
    sqlite_engine = create_engine(f"sqlite:///{sqlite_file.resolve()}")

    # 1. Create all tables in SQLite file
    Base.metadata.create_all(bind=sqlite_engine)
    print(f"[+] SQLite database file created: {sqlite_file}")

    # 2. Copy data from MySQL to SQLite
    total_copied = 0
    with mysql_engine.connect() as mysql_conn, sqlite_engine.connect() as sqlite_conn:
        for table_name in Base.metadata.tables.keys():
            try:
                rows = mysql_conn.execute(text(f"SELECT * FROM `{table_name}`")).fetchall()
                if rows:
                    cols = [col.name for col in Base.metadata.tables[table_name].columns]
                    placeholders = ", ".join([":" + c for c in cols])
                    cols_str = ", ".join(["`" + c + "`" for c in cols])
                    insert_sql = text(f"INSERT OR REPLACE INTO `{table_name}` ({cols_str}) VALUES ({placeholders})")
                    for r in rows:
                        row_dict = dict(r._mapping)
                        sqlite_conn.execute(insert_sql, row_dict)
                    sqlite_conn.commit()
                    total_copied += len(rows)
                    print(f"  - Synced table `{table_name}`: {len(rows)} records")
            except Exception as e:
                print(f"  - Notice for `{table_name}`: {e}")

    # 3. Export MySQL Schema DDL SQL script
    schema_sql_path = db_dir / "schema.sql"
    with mysql_engine.connect() as conn, open(schema_sql_path, "w", encoding="utf-8") as f:
        f.write("-- 🌸 YURAE BEAUTY DATABASE SCHEMA DUMP\n")
        f.write("-- Database: yuraedb (MySQL 5.7+ / MariaDB / SQLite compatible)\n\n")
        f.write("CREATE DATABASE IF NOT EXISTS `yuraedb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n")
        f.write("USE `yuraedb`;\n\n")

        for table_name in Base.metadata.tables.keys():
            try:
                res = conn.execute(text(f"SHOW CREATE TABLE `{table_name}`")).fetchone()
                if res and len(res) > 1:
                    f.write(f"-- Table structure for `{table_name}`\n")
                    f.write(f"DROP TABLE IF EXISTS `{table_name}`;\n")
                    f.write(f"{res[1]};\n\n")
            except Exception:
                pass
    print(f"[+] Schema DDL script exported: {schema_sql_path}")

    # 4. Create README in db folder
    readme_path = db_dir / "README.md"
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("""# 🗄️ Yurae Beauty Database Directory

This directory contains the database files and SQL schema for the **YURAE BEAUTY** platform.

## Files in this Directory:
- **`yuraedb.sqlite3`**: Local SQLite database file (pre-populated with 20 tables and catalog data). You can open this directly in VS Code / Antigravity with the SQLite Viewer extension.
- **`schema.sql`**: Complete MySQL DDL schema for creating all 20 tables, foreign keys, and indexes.
- **`sync_db.py`**: Auto-sync script to export and update local database files.

## Database Connection Options:
### Option 1: MySQL (Default Recommended)
- **Host**: `localhost:3306`
- **Database**: `yuraedb`
- **User**: `yuraeuser`
- **Password**: `Keerthi@07`
- **Connection URL**: `mysql+pymysql://yuraeuser:Keerthi%4007@localhost:3306/yuraedb`

### Option 2: Local SQLite File
- In `.env`, you can set:
  ```env
  DATABASE_URL="sqlite:///db/yuraedb.sqlite3"
  ```
""")
    print(f"[+] Database guide created: {readme_path}")
    print(f"[+] Total {total_copied} records synced to local `db/` folder!")


if __name__ == "__main__":
    sync_db_files()
