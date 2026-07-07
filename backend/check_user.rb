#!/usr/bin/env ruby

require_relative 'config/environment'

user = User.find_by(phone: '+254712000001')
if user
  puts "Phone: #{user.phone}"
  puts "Name: #{user.display_name}"
  puts "Role: #{user.role}"
  puts "Notifications: #{user.notifications.count}"
  puts "Unread: #{user.notifications.unread.count}"
else
  puts "User not found"
end