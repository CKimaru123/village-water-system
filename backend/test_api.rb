#!/usr/bin/env ruby

require 'net/http'
require 'json'
require 'uri'

def test_signup_api
  # Test data for household client signup
  test_data = {
    user: {
      account_type: 'household',
      first_name: 'John',
      last_name: 'Doe',
      phone: '0712345678',
      alt_phone: '0723456789',
      email: 'john@example.com',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      plot_number: 'P001',
      household_size: 5,
      village: 'Kiambu',
      communication_preference: 'SMS',
      landmark: 'Near the market',
      newsletter_subscription: true
    }
  }

  uri = URI('http://127.0.0.1:3001/api/v1/auth/signup')
  http = Net::HTTP.new(uri.host, uri.port)
  
  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request.body = test_data.to_json
  
  puts "🧪 Testing Signup API..."
  puts "URL: #{uri}"
  puts "Data: #{test_data.to_json}"
  puts ""
  
  begin
    response = http.request(request)
    puts "📊 Response Status: #{response.code}"
    puts "📄 Response Body:"
    puts response.body
    puts ""
    
    if response.code == '201'
      puts "✅ Signup API is working!"
    else
      puts "❌ Signup API failed"
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
test_signup_api