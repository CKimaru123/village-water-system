#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

puts "=== ACTIONCABLE TEST ==="
puts "ActionCable server: #{ActionCable.server.class}"
puts "Cable config: #{Rails.application.config.action_cable.inspect}"
puts

# Test broadcasting
puts "Testing broadcast..."
ActionCable.server.broadcast("test_channel", { message: "Hello from ActionCable!" })
puts "Broadcast sent to test_channel"

# Test real-time notification service
puts "\nTesting RealTimeNotificationService..."
begin
  # Find a client to test with
  client = User.client.first
  admin = User.admin.first || User.super_admin.first
  
  if client && admin
    puts "Testing with client: #{client.display_name} (ID: #{client.id})"
    puts "Testing with admin: #{admin.display_name} (#{admin.role})"
    
    RealTimeNotificationService.notify_profile_update(
      client.id, 
      ['phone'], 
      admin
    )
    puts "Real-time notification sent successfully!"
  else
    puts "No client or admin found for testing"
  end
rescue => e
  puts "Error testing RealTimeNotificationService: #{e.message}"
  puts e.backtrace.first(3)
end