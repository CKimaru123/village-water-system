#!/usr/bin/env ruby

# Add the Rails environment
require_relative 'config/environment'

puts "Creating test notifications..."

# Find test users
client = User.find_by(phone: '+254712000001') # Collins Kiragu
admin = User.find_by(phone: '+254712000003')  # Test Admin

if client && admin
  puts "Found client: #{client.display_name}"
  puts "Found admin: #{admin.display_name}"
  
  # Create test notifications for the client
  notifications = [
    {
      user: client,
      related_user: admin,
      title: 'Profile Updated',
      message: 'Your profile information was updated by Test Admin. Please review the changes in your profile history.',
      notification_type: 'profile_updated',
      category: 'profile',
      priority: 'normal',
      action_url: '/client/profile-history'
    },
    {
      user: client,
      title: 'Welcome to the System',
      message: 'Welcome to the Village Water Management System! Your account has been successfully set up.',
      notification_type: 'general_announcement',
      category: 'general',
      priority: 'low'
    },
    {
      user: client,
      title: 'Service Connection Active',
      message: 'Your water service connection is now active. You can start using the system to manage your account.',
      notification_type: 'service_connected',
      category: 'service',
      priority: 'high',
      action_url: '/client/dashboard'
    }
  ]
  
  notifications.each do |notification_data|
    notification = Notification.create!(notification_data)
    puts "Created notification: #{notification.title}"
  end
  
  puts "✅ Test notifications created successfully!"
  puts "Total notifications for #{client.display_name}: #{client.notifications.count}"
  puts "Unread notifications: #{client.notifications.unread.count}"
else
  puts "❌ Could not find test users"
  puts "Available users:"
  User.all.each do |user|
    puts "- #{user.display_name} (#{user.phone}) - #{user.role}"
  end
end