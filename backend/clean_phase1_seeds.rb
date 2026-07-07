# Clean Phase 1 Seeds - Only create what's missing

puts "🧹 Cleaning and seeding Phase 1 data..."

# Create Tariff Rates if they don't exist
if TariffRate.count == 0
  puts "Creating tariff rates..."
  
  # Household tariff rates (tiered pricing)
  TariffRate.create!([
    {
      rate_name: 'Household Tier 1',
      account_type: 'household',
      tier_min_usage: 0,
      tier_max_usage: 10,
      rate_per_unit: 25.00,
      fixed_charge: 150.00,
      effective_date: Date.current.beginning_of_year
    },
    {
      rate_name: 'Household Tier 2',
      account_type: 'household',
      tier_min_usage: 10.01,
      tier_max_usage: 20,
      rate_per_unit: 35.00,
      fixed_charge: 0,
      effective_date: Date.current.beginning_of_year
    },
    {
      rate_name: 'Household Tier 3',
      account_type: 'household',
      tier_min_usage: 20.01,
      tier_max_usage: nil,
      rate_per_unit: 50.00,
      fixed_charge: 0,
      effective_date: Date.current.beginning_of_year
    },
    {
      rate_name: 'Institution Standard',
      account_type: 'institution',
      tier_min_usage: 0,
      tier_max_usage: nil,
      rate_per_unit: 45.00,
      fixed_charge: 300.00,
      effective_date: Date.current.beginning_of_year
    }
  ])
  
  puts "✅ Created #{TariffRate.count} tariff rates"
end

# Create meter for existing connection if missing
connection = Connection.first
if connection && !connection.meter
  puts "Creating meter for existing connection..."
  
  meter = connection.create_meter!(
    meter_type: 'digital',
    meter_size: '15mm',
    installation_date: connection.connection_date,
    last_reading_date: 1.month.ago,
    last_reading_value: 1250.5,
    calibration_date: connection.connection_date,
    next_calibration_date: 1.year.from_now
  )
  
  puts "✅ Created meter #{meter.meter_serial} for connection #{connection.connection_number}"
end

# Create test users if they don't exist
test_household_phone = '+254712000001'
test_institution_phone = '+254712000002'
test_admin_phone = '+254712000003'

# Test household client
unless User.exists?(phone: test_household_phone)
  puts "Creating test household client..."
  
  household_client = User.create!(
    account_type: 'household',
    role: 'client',
    first_name: 'John',
    last_name: 'Doe',
    alt_phone: '+254700000001',
    plot_number: 'P001',
    household_size: 4,
    village: 'Kiambu',
    communication_preference: 'sms',
    password: 'Password123!',
    email: 'john.doe@example.com',
    phone: test_household_phone
  )

  # Create connection for household client
  connection = household_client.connections.create!(
    connection_date: 6.months.ago,
    connection_type: 'new',
    service_line_size: '15mm',
    zone: 'North Zone',
    gps_latitude: -1.2921,
    gps_longitude: 36.8219,
    installation_notes: 'Standard household connection'
  )

  # Create meter for the connection
  meter = connection.create_meter!(
    meter_type: 'digital',
    meter_size: '15mm',
    installation_date: 6.months.ago,
    last_reading_date: 1.month.ago,
    last_reading_value: 1250.5,
    calibration_date: 6.months.ago,
    next_calibration_date: 6.months.from_now
  )

  puts "✅ Created household client #{household_client.full_name} with connection #{connection.connection_number}"
end

# Test institution client
unless User.exists?(phone: test_institution_phone)
  puts "Creating test institution client..."
  
  institution_client = User.create!(
    account_type: 'institution',
    role: 'client',
    institution_name: 'Kiambu Primary School',
    institution_type: 'school',
    contact_person: 'Mary Wanjiku',
    alt_contact: '+254700000002',
    population_served: 300,
    storage_capacity: '5000L',
    communication_preference: 'email',
    password: 'Password123!',
    email: 'admin@kiambuprimary.ac.ke',
    phone: test_institution_phone
  )

  # Create connection for institution client
  connection = institution_client.connections.create!(
    connection_date: 1.year.ago,
    connection_type: 'new',
    service_line_size: '25mm',
    zone: 'South Zone',
    gps_latitude: -1.3000,
    gps_longitude: 36.8300,
    installation_notes: 'Institution connection with larger capacity'
  )

  # Create meter for the connection
  meter = connection.create_meter!(
    meter_type: 'smart',
    meter_size: '25mm',
    installation_date: 1.year.ago,
    last_reading_date: 1.month.ago,
    last_reading_value: 2890.2,
    calibration_date: 1.year.ago,
    next_calibration_date: 1.year.from_now
  )

  puts "✅ Created institution client #{institution_client.institution_name} with connection #{connection.connection_number}"
end

# Test admin user
unless User.exists?(phone: test_admin_phone)
  puts "Creating test admin user..."
  
  admin_user = User.create!(
    account_type: 'household',
    role: 'admin',
    first_name: 'Test',
    last_name: 'Admin',
    alt_phone: '+254700000003',
    plot_number: 'ADMIN',
    household_size: 1,
    village: 'Kiambu',
    communication_preference: 'email',
    password: 'AdminPass123!',
    email: 'testadmin@watercompany.co.ke',
    phone: test_admin_phone
  )

  puts "✅ Created test admin user: #{admin_user.full_name}"
end

puts "\n🎉 Phase 1 setup completed!"
puts "\n📊 Final Database Summary:"
puts "Users: #{User.count}"
puts "User Profiles: #{UserProfile.count}"
puts "Connections: #{Connection.count}"
puts "Meters: #{Meter.count}"
puts "Tariff Rates: #{TariffRate.count}"

puts "\n🔑 Test Login Credentials:"
puts "Household Client: #{test_household_phone} / Password123!"
puts "Institution Client: #{test_institution_phone} / Password123!"
puts "Test Admin: #{test_admin_phone} / AdminPass123!"