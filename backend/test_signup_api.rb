# Test script to verify client signup API
# Run this with: ruby test_signup_api.rb

require 'net/http'
require 'json'
require 'uri'

# Test data for household client signup
household_data = {
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

# Test data for institution client signup
institution_data = {
  user: {
    account_type: 'institution',
    institution_name: 'Kiambu Primary School',
    institution_type: 'School',
    contact_person: 'Jane Smith',
    phone: '0734567890',
    alt_contact: '0745678901',
    email: 'school@example.com',
    password: 'Password123!',
    password_confirmation: 'Password123!',
    population_served: 200,
    storage_capacity: '5000L',
    communication_preference: 'Email',
    landmark: 'Next to the church'
  }
}

def test_signup(data, type)
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
  uri = URI("#{BASE_URL}/auth/signup")
  http = Net::HTTP.new(uri.host, uri.port)
  
  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request.body = data.to_json
  
  puts "\n=== Testing #{type} Client Signup ==="
  puts "Request: #{data.to_json}"
  
  begin
    response = http.request(request)
    puts "Status: #{response.code}"
    puts "Response: #{response.body}"
    
    # Parse and check if role is 'client'
    if response.code == '201'
      parsed = JSON.parse(response.body)
      user_role = parsed.dig('data', 'user', 'role')
      puts "✅ User role: #{user_role}" if user_role == 'client'
    end
  rescue => e
    puts "Error: #{e.message}"
  end
end

puts "Starting Client Signup API Tests..."
puts "Make sure your Rails server is running on http://127.0.0.1:3001"
puts "All signups should create clients with role='client'"

# Test household client signup
test_signup(household_data, 'Household')

# Test institution client signup  
test_signup(institution_data, 'Institution')

puts "\nTests completed!"
puts "Note: All users created through signup should have role='client'"