#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

puts "🧪 Testing User Model..."

begin
  # Test creating a user
  user_data = {
    account_type: 'household',
    first_name: 'Test',
    last_name: 'User',
    phone: '+254712345678',
    alt_phone: '+254723456789',
    email: 'test@example.com',
    password: 'Password123!',
    password_confirmation: 'Password123!',
    plot_number: 'P001',
    household_size: 5,
    village: 'Test Village',
    communication_preference: 'SMS',
    landmark: 'Test landmark',
    newsletter_subscription: true
  }
  
  puts "📝 Creating user with data:"
  puts user_data.inspect
  puts ""
  
  user = User.new(user_data)
  user.role = 'client'
  user.status = 'active'
  
  if user.valid?
    puts "✅ User model validation passed!"
    
    if user.save
      puts "✅ User saved successfully!"
      puts "   ID: #{user.id}"
      puts "   Name: #{user.full_name}"
      puts "   Phone: #{user.phone}"
      puts "   Role: #{user.role}"
      puts ""
      
      # Clean up - delete the test user
      user.destroy
      puts "🧹 Test user cleaned up"
    else
      puts "❌ Failed to save user:"
      user.errors.full_messages.each { |msg| puts "   - #{msg}" }
    end
  else
    puts "❌ User model validation failed:"
    user.errors.full_messages.each { |msg| puts "   - #{msg}" }
  end
  
rescue => e
  puts "❌ Error testing user model: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end