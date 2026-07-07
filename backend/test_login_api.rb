#!/usr/bin/env ruby

require 'net/http'
require 'json'
require 'uri'

def test_login_api
  # First, let's see what users exist
  puts "🔍 Checking existing users..."
  
  # Load Rails to check users
  require_relative 'config/environment'
  
  users = User.all
  if users.empty?
    puts "❌ No users found. Please create a user first:"
    puts "   rails db:seed  # Creates admin user"
    puts "   Or sign up through the frontend"
    return
  end
  
  puts "📊 Found #{users.count} users:"
  users.each do |user|
    puts "   - #{user.display_name} (#{user.phone}) - Role: #{user.role}"
  end
  puts ""
  
  # Test with the first user
  test_user = users.first
  
  # Test data for login
  login_data = {
    user: {
      phone: test_user.phone,
      password: 'Password123!'  # This should match what you used during signup
    }
  }

  uri = URI('http://127.0.0.1:3001/api/v1/auth/login')
  http = Net::HTTP.new(uri.host, uri.port)
  
  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request.body = login_data.to_json
  
  puts "🧪 Testing Login API..."
  puts "URL: #{uri}"
  puts "Data: #{login_data.to_json}"
  puts ""
  
  begin
    response = http.request(request)
    puts "📊 Response Status: #{response.code}"
    puts "📄 Response Body:"
    puts response.body
    puts ""
    
    if response.code == '201'
      puts "✅ Login API is working!"
      
      # Parse response to show user info
      data = JSON.parse(response.body)
      if data['success']
        user_info = data['data']['user']
        puts "👤 Logged in as: #{user_info['first_name'] || user_info['contact_person']} (#{user_info['role']})"
      end
    else
      puts "❌ Login API failed"
      puts ""
      puts "💡 Common issues:"
      puts "   - Wrong password (try the password you used during signup)"
      puts "   - User doesn't exist (create one first)"
      puts "   - Server not running (rails server -p 3001)"
    end
    
  rescue => e
    puts "❌ Network Error: #{e.message}"
    puts ""
    puts "🔧 Make sure Rails server is running:"
    puts "   cd village-water-system/backend"
    puts "   rails server -p 3001"
  end
end

# Test the API
test_login_api