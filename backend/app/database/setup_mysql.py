import pymysql
import sys

def init_mysql():
    passwords_to_try = ["Keerthi@07", "root", "admin", "password", "123456", ""]
    success = False

    for pwd in passwords_to_try:
        try:
            conn = pymysql.connect(host="localhost", port=3306, user="root", password=pwd)
            print(f"[+] Successfully connected to MySQL as 'root' with password: '{pwd}'")
            with conn.cursor() as cursor:
                cursor.execute("CREATE DATABASE IF NOT EXISTS yuraedb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                cursor.execute("CREATE USER IF NOT EXISTS 'yuraeuser'@'localhost' IDENTIFIED BY 'Keerthi@07';")
                cursor.execute("ALTER USER 'yuraeuser'@'localhost' IDENTIFIED BY 'Keerthi@07';")
                cursor.execute("GRANT ALL PRIVILEGES ON yuraedb.* TO 'yuraeuser'@'localhost';")
                cursor.execute("FLUSH PRIVILEGES;")
            conn.commit()
            conn.close()
            print("[+] Database 'yuraedb' and user 'yuraeuser' configured with ALL PRIVILEGES!")
            success = True
            break
        except Exception as e:
            # print(f"[-] Root password trial failed for '{pwd}': {e}")
            pass

    if not success:
        print("[!] Could not connect automatically as root with common passwords.")
        print("[!] Please run the SQL setup commands in your MySQL client / MySQL Workbench.")

if __name__ == "__main__":
    init_mysql()
