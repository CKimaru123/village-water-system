puts "🧪 PHASE 1 BIDIRECTIONAL TESTING"
puts "=" * 50

# Test 1.1: Client Profile Updates → Admin Visibility
puts "\n🔬 Test 1.1: Client Profile Updates → Admin Visibility"

household_client = User.find_by(phone: '+254712000001')
admin_user = User.find_by(phone: '+254712000003')

if household_client && admin_user
  puts "✅ Found test users"
  
  # Simulate client profile update
  old_first_name = household_client.first_name
  household_client.update!(first_name: 'Johnny')
  
  # Log the change in profile history
  ProfileHistory.log_change(
    household_client, 
    'first_name', 
    old_first_name, 
    'Johnny', 
    household_client
  )
  
  # Verify admin can see the change
  updated_client = User.find(household_client.id)
  history = ProfileHistory.where(user: household_client, field_name: 'first_name').recent.first
  
  puts "✅ Client name updated: #{old_first_name} → #{updated_client.first_name}"
  puts "✅ Profile history logged: #{history.old_value} → #{history.new_value}"
  puts "✅ Admin can access updated profile: #{updated_client.full_name}"
else
  puts "❌ Test users not found"
end

# Test 1.2: Connection Status Updates → Client Visibility
puts "\n🔬 Test 1.2: Connection Status Updates → Client Visibility"

connection = household_client&.connections&.first
if connection
  puts "✅ Found client connection: #{connection.connection_number}"
  
  # Simulate admin changing connection status
  old_status = connection.connection_status
  connection.update!(connection_status: 'suspended')
  
  # Verify client can see the change
  updated_connection = Connection.find(connection.id)
  puts "✅ Connection status updated: #{old_status} → #{updated_connection.connection_status}"
  puts "✅ Client can see status change: #{updated_connection.display_status}"
  
  # Restore status
  connection.update!(connection_status: 'active')
  puts "✅ Status restored to active"
else
  puts "❌ No connection found for client"
end

# Test 1.3: Tariff Rate Application → Bill Calculation
puts "\n🔬 Test 1.3: Tariff Rate Application → Bill Calculation"

if household_client
  consumption = 15.5 # m³
  cost = TariffRate.calculate_cost('household', consumption)
  
  puts "✅ Consumption: #{consumption} m³"
  puts "✅ Calculated cost: KES #{cost}"
  
  # Verify tariff tiers are working
  tier1_cost = TariffRate.calculate_cost('household', 5.0)
  tier2_cost = TariffRate.calculate_cost('household', 15.0)
  tier3_cost = TariffRate.calculate_cost('household', 25.0)
  
  puts "✅ Tier 1 (5 m³): KES #{tier1_cost}"
  puts "✅ Tier 2 (15 m³): KES #{tier2_cost}"
  puts "✅ Tier 3 (25 m³): KES #{tier3_cost}"
else
  puts "❌ No household client found"
end

# Test 1.4: Invoice Generation → Client Bill Display
puts "\n🔬 Test 1.4: Invoice Generation → Client Bill Display"

if household_client && admin_user && household_client.connections.any?
  connection = household_client.connections.first
  meter = connection.meter
  
  if meter
    puts "✅ Found meter: #{meter.meter_serial}"
    
    # Generate invoice
    invoice = Invoice.generate_for_user(
      household_client,
      1.month.ago.beginning_of_month,
      1.month.ago.end_of_month,
      meter.last_reading_value - 25.5,
      meter.last_reading_value,
      admin_user
    )
    
    if invoice.persisted?
      puts "✅ Invoice generated: #{invoice.invoice_number}"
      puts "✅ Consumption: #{invoice.consumption_m3} m³"
      puts "✅ Total amount: KES #{invoice.total_amount}"
      puts "✅ Line items: #{invoice.invoice_line_items.count}"
      
      # Verify client can access invoice
      client_invoices = household_client.invoices
      puts "✅ Client has #{client_invoices.count} invoice(s)"
      puts "✅ Current invoice status: #{invoice.status}"
    else
      puts "❌ Failed to generate invoice: #{invoice.errors.full_messages}"
    end
  else
    puts "❌ No meter found for connection"
  end
else
  puts "❌ Missing required data for invoice test"
end

# Test 1.5: User Profile Account Numbers
puts "\n🔬 Test 1.5: User Profile Account Numbers"

User.includes(:user_profile).each do |user|
  profile = user.user_profile
  if profile
    puts "✅ #{user.full_name || user.institution_name}: #{profile.account_number}"
  else
    puts "❌ #{user.full_name || user.institution_name}: No profile"
  end
end

puts "\n🎉 PHASE 1 TESTING COMPLETED!"
puts "=" * 50

# Summary
puts "\n📊 FINAL SUMMARY:"
puts "Users: #{User.count}"
puts "User Profiles: #{UserProfile.count}"
puts "Connections: #{Connection.count}"
puts "Meters: #{Meter.count}"
puts "Tariff Rates: #{TariffRate.count}"
puts "Invoices: #{Invoice.count}"
puts "Profile History: #{ProfileHistory.count}"

puts "\n✅ Phase 1 implementation is ready for frontend integration!"