#!/usr/bin/env ruby

# Direct migration runner to bypass Rails loading issues
require 'pg'
require 'bcrypt'

# Database configuration
DB_CONFIG = {
  host: '127.0.0.1',
  port: 5432,
  dbname: 'village_water_development',
  user: 'postgres',
  password: 'postgres123'
}

def run_migration
  begin
    # Connect to PostgreSQL
    conn = PG.connect(DB_CONFIG)
    puts "✅ Connected to PostgreSQL database"

    # Check if users table exists
    result = conn.exec("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');")
    table_exists = result[0]['exists'] == 't'

    if table_exists
      puts "ℹ️  Users table already exists"
      return
    end

    puts "🔄 Creating users table..."

    # Create users table
    create_table_sql = <<~SQL
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        account_type VARCHAR NOT NULL DEFAULT 'household',
        role VARCHAR NOT NULL DEFAULT 'client',
        status VARCHAR NOT NULL DEFAULT 'active',
        phone VARCHAR NOT NULL,
        email VARCHAR,
        password_digest VARCHAR NOT NULL,
        communication_preference VARCHAR NOT NULL,
        landmark TEXT,
        newsletter_subscription BOOLEAN DEFAULT false,
        first_name VARCHAR,
        last_name VARCHAR,
        alt_phone VARCHAR,
        plot_number VARCHAR,
        household_size INTEGER,
        village VARCHAR,
        institution_name VARCHAR,
        institution_type VARCHAR,
        contact_person VARCHAR,
        alt_contact VARCHAR,
        population_served INTEGER,
        storage_capacity VARCHAR,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    SQL

    conn.exec(create_table_sql)
    puts "✅ Users table created"

    # Create indexes
    indexes = [
      "CREATE UNIQUE INDEX index_users_on_phone ON users (phone);",
      "CREATE UNIQUE INDEX index_users_on_email ON users (email) WHERE email IS NOT NULL;",
      "CREATE INDEX index_users_on_account_type ON users (account_type);",
      "CREATE INDEX index_users_on_role ON users (role);",
      "CREATE INDEX index_users_on_status ON users (status);"
    ]

    indexes.each do |index_sql|
      conn.exec(index_sql)
    end
    puts "✅ Indexes created"

    # Create schema_migrations table if it doesn't exist
    conn.exec(<<~SQL)
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR PRIMARY KEY
      );
    SQL

    # Insert migration version
    conn.exec("INSERT INTO schema_migrations (version) VALUES ('20241228000001') ON CONFLICT DO NOTHING;")
    puts "✅ Migration version recorded"

    puts "🎉 Database migration completed successfully!"

  rescue PG::Error => e
    puts "❌ Database error: #{e.message}"
    puts "Please check your database configuration and ensure PostgreSQL is running"
  rescue => e
    puts "❌ Error: #{e.message}"
  ensure
    conn&.close
  end
end

def create_admin_user
  begin
    conn = PG.connect(DB_CONFIG)
    
    # Check if admin already exists
    result = conn.exec("SELECT COUNT(*) FROM users WHERE role = 'admin';")
    admin_count = result[0]['count'].to_i

    if admin_count > 0
      puts "ℹ️  Admin users already exist. Skipping admin creation."
      return
    end

    puts "🔄 Creating first admin user..."

    # Hash the password
    password_hash = BCrypt::Password.create('AdminPassword123!')

    # Insert admin user
    insert_sql = <<~SQL
      INSERT INTO users (
        account_type, role, status, first_name, last_name, phone, email,
        password_digest, alt_phone, plot_number, household_size, village,
        communication_preference, landmark, newsletter_subscription,
        created_at, updated_at
      ) VALUES (
        'household', 'admin', 'active', 'System', 'Administrator',
        '+254700000000', 'admin@village-water-system.com',
        $1, '+254700000001', 'ADMIN001', 1, 'System',
        'Email', 'System Administration', false,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );
    SQL

    conn.exec_params(insert_sql, [password_hash])

    puts "✅ Created first admin user:"
    puts "   Email: admin@village-water-system.com"
    puts "   Phone: +254700000000"
    puts "   Password: AdminPassword123!"
    puts "   Role: admin"
    puts ""
    puts "⚠️  IMPORTANT: Change the admin password after first login!"

  rescue PG::Error => e
    puts "❌ Database error: #{e.message}"
  rescue => e
    puts "❌ Error: #{e.message}"
  ensure
    conn&.close
  end
end

# Run the migration and seeding
puts "🚀 Starting database setup..."
run_migration
create_admin_user
puts "🌱 Database setup completed!"