#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

puts "🗄️  Village Water System - User Database Viewer"
puts "=" * 50

# Display summary
total_users = User.count
clients = User.client.count
admins = User.admin.count
households = User.household.count
institutions = User.institution.count

puts "📊 SUMMARY:"
puts "  Total Users: #{total_users}"
puts "  Clients: #{clients}"
puts "  Admins: #{admins}"
puts "  Households: #{households}"
puts "  Institutions: #{institutions}"
puts ""

if total_users > 0
  puts "👥 ALL USERS:"
  puts "-" * 50
  
  User.order(:created_at).each_with_index do |user, index|
    puts "#{index + 1}. #{user.display_name || 'N/A'}"
    puts "   Phone: #{user.phone}"
    puts "   Email: #{user.email || 'N/A'}"
    puts "   Type: #{user.account_type.capitalize} #{user.role.capitalize}"
    puts "   Status: #{user.status.capitalize}"
    puts "   Created: #{user.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
    if user.household?
      puts "   Village: #{user.village}"
      puts "   Plot: #{user.plot_number}"
      puts "   Household Size: #{user.household_size}"
    elsif user.institution?
      puts "   Institution: #{user.institution_name}"
      puts "   Type: #{user.institution_type}"
      puts "   Contact: #{user.contact_person}"
    end
    
    puts ""
  end
else
  puts "📭 No users found in database."
  puts ""
  puts "💡 To create the admin user, run:"
  puts "   rails db:seed"
end

puts "🔄 To refresh this view, run:"
puts "   ruby view_users.rb"