#!/usr/bin/env ruby

# Load Rails environment
require_relative 'config/environment'

puts "=== CLIENT PROFILE AUDIT LOGS ==="
puts "Total audit logs: #{ClientProfileAuditLog.count}"
puts

if ClientProfileAuditLog.count > 0
  puts "Recent audit logs:"
  ClientProfileAuditLog.recent.limit(5).each do |log|
    puts "- #{log.client.display_name}: #{log.field_name} - #{log.change_description}"
    puts "  Modified by: #{log.modified_by.display_name} (#{log.modified_by.role})"
    puts "  Time: #{log.formatted_timestamp}"
    puts "  Sensitivity: #{log.sensitivity_level}"
    puts
  end
else
  puts "No audit logs found."
end