puts "=== DATABASE STATUS ==="
puts "Users: #{User.count}"
puts "User Profiles: #{UserProfile.count}"
puts "Connections: #{Connection.count}"
puts "Meters: #{Meter.count}"
puts "Tariff Rates: #{TariffRate.count}"
puts "Invoices: #{Invoice.count}"

puts "\n=== USERS ==="
User.all.each do |user|
  name = user.full_name || user.institution_name || "No name"
  puts "#{user.id}: #{name} (#{user.role}) - #{user.phone}"
  puts "  Profile: #{user.user_profile ? 'Yes' : 'No'}"
  puts "  Connections: #{user.connections.count}"
end

puts "\n=== CONNECTIONS ==="
Connection.all.each do |conn|
  puts "#{conn.connection_number} - #{conn.user.full_name || conn.user.institution_name}"
  puts "  Meter: #{conn.meter ? conn.meter.meter_serial : 'None'}"
end

puts "\n=== TARIFF RATES ==="
TariffRate.all.each do |rate|
  puts "#{rate.rate_name} (#{rate.account_type}): #{rate.rate_per_unit} KES/m³"
end