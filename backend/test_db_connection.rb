#!/usr/bin/env ruby

require 'pg'

# Test database connection
DB_CONFIG = {
  host: '127.0.0.1',
  port: 5432,
  dbname: 'village_water_development',
  user: 'postgres',
  password: 'postgres123'
}

puts "🔍 Testing PostgreSQL connection..."
puts "Host: #{DB_CONFIG[:host]}"
puts "Port: #{DB_CONFIG[:port]}"
puts "Database: #{DB_CONFIG[:dbname]}"
puts "User: #{DB_CONFIG[:user]}"
puts ""

begin
  # Try to connect
  conn = PG.connect(DB_CONFIG)
  puts "✅ Successfully connected to PostgreSQL!"
  
  # Test a simple query
  result = conn.exec("SELECT version();")
  puts "📊 PostgreSQL Version: #{result[0]['version']}"
  
  # Check if database exists
  result = conn.exec("SELECT datname FROM pg_database WHERE datname = '#{DB_CONFIG[:dbname]}';")
  if result.ntuples > 0
    puts "✅ Database '#{DB_CONFIG[:dbname]}' exists"
  else
    puts "❌ Database '#{DB_CONFIG[:dbname]}' does not exist"
    puts "Creating database..."
    conn.exec("CREATE DATABASE #{DB_CONFIG[:dbname]};")
    puts "✅ Database created successfully"
  end
  
  conn.close
  puts "🎉 Database connection test passed!"
  
rescue PG::ConnectionBad => e
  puts "❌ Connection failed: #{e.message}"
  puts ""
  puts "🔧 Troubleshooting steps:"
  puts "1. Make sure PostgreSQL is running:"
  puts "   net start postgresql*"
  puts ""
  puts "2. Check if the service name is correct:"
  puts "   services.msc (look for PostgreSQL)"
  puts ""
  puts "3. Verify connection details in config/database.yml"
  puts ""
rescue PG::Error => e
  puts "❌ Database error: #{e.message}"
rescue => e
  puts "❌ Unexpected error: #{e.message}"
end