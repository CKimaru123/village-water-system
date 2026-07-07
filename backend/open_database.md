# 📊 Database Viewing Guide

## Quick Access to Your Data

### Option 1: VS Code SQLite Viewer Extension
1. Install "SQLite Viewer" extension by qwtel
2. Right-click `storage/development.sqlite3` → "Open with SQLite Viewer"
3. Browse tables visually!

### Option 2: Command Line (Always Works)
```bash
# In backend directory
sqlite3 storage/development.sqlite3

# Then run SQL commands:
.tables                    # Show all tables
SELECT * FROM users;       # Show all users
.quit                      # Exit
```

### Option 3: Ruby Script (Custom Viewer)
```bash
ruby view_users.rb        # Our custom user viewer
```

### Option 4: Browser API (Development Only)
Visit: http://127.0.0.1:3001/api/v1/debug/users

## Your Database File Location
📁 `village-water-system/backend/storage/development.sqlite3`

## Common SQL Queries
```sql
-- See all users
SELECT * FROM users;

-- Count users by type
SELECT account_type, role, COUNT(*) as count 
FROM users 
GROUP BY account_type, role;

-- Recent signups
SELECT first_name, last_name, phone, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Find specific user
SELECT * FROM users WHERE phone = '+254758868629';
```