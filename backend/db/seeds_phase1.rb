# Phase 1 Database Seeds
# This file seeds the database with test data for Phase 1 implementation

puts "🌱 Starting Phase 1 database seeding..."

# Create Tariff Rates first
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
  }
])

# Institution tariff rates
TariffRate.create!([
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

# Create test users with connections and meters
puts "Creating test users with connections..."

# Test household client
household_client = User.find_or_create_by(phone: '+254712345678') do |user|
  user.account_type = 'household'
  user.role = 'client'
  user.first_name = 'John'
  user.last_name = 'Doe'
  user.alt_phone = '+254700000001'
  user.plot_number = 'P001'
  user.household_size = 4
  user.village = 'Kiambu'
  user.communication_preference = 'sms'
  user.password = 'Password123!'
  user.email = 'john.doe@example.com'
end

# Create connection for household client
if household_client.persisted? && household_client.connections.empty?
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

  puts "✅ Created connection #{connection.connection_number} with meter #{meter.meter_serial} for #{household_client.full_name}"
end

# Test institution client
institution_client = User.find_or_create_by(phone: '+254723456789') do |user|
  user.account_type = 'institution'
  user.role = 'client'
  user.institution_name = 'Kiambu Primary School'
  user.institution_type = 'school'
  user.contact_person = 'Mary Wanjiku'
  user.alt_contact = '+254700000002'
  user.population_served = 300
  user.storage_capacity = '5000L'
  user.communication_preference = 'email'
  user.password = 'Password123!'
  user.email = 'admin@kiambuprimary.ac.ke'
end

# Create connection for institution client
if institution_client.persisted? && institution_client.connections.empty?
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

  puts "✅ Created connection #{connection.connection_number} with meter #{meter.meter_serial} for #{institution_client.institution_name}"
end

# Create admin user
admin_user = User.find_or_create_by(phone: '+254734567890') do |user|
  user.account_type = 'household'
  user.role = 'admin'
  user.first_name = 'Admin'
  user.last_name = 'User'
  user.alt_phone = '+254700000003'
  user.plot_number = 'ADMIN'
  user.household_size = 1
  user.village = 'Kiambu'
  user.communication_preference = 'email'
  user.password = 'AdminPass123!'
  user.email = 'admin@watercompany.co.ke'
end

puts "✅ Created admin user: #{admin_user.full_name}"

# Generate sample invoices
puts "Generating sample invoices..."

# Generate invoice for household client
if household_client.persisted? && household_client.invoices.empty?
  # Previous month invoice
  prev_month_start = 2.months.ago.beginning_of_month
  prev_month_end = 2.months.ago.end_of_month
  
  invoice = Invoice.generate_for_user(
    household_client,
    prev_month_start,
    prev_month_end,
    1200.0,
    1225.5,
    admin_user
  )
  
  if invoice.persisted?
    invoice.update!(status: 'paid', paid_at: 1.month.ago)
    puts "✅ Created paid invoice #{invoice.invoice_number} for #{household_client.full_name}"
  end

  # Current month invoice (unpaid)
  current_month_start = 1.month.ago.beginning_of_month
  current_month_end = 1.month.ago.end_of_month
  
  current_invoice = Invoice.generate_for_user(
    household_client,
    current_month_start,
    current_month_end,
    1225.5,
    1250.5,
    admin_user
  )
  
  if current_invoice.persisted?
    current_invoice.update!(status: 'sent')
    puts "✅ Created current invoice #{current_invoice.invoice_number} for #{household_client.full_name}"
  end
end

# Generate invoice for institution client
if institution_client.persisted? && institution_client.invoices.empty?
  # Current month invoice
  current_month_start = 1.month.ago.beginning_of_month
  current_month_end = 1.month.ago.end_of_month
  
  invoice = Invoice.generate_for_user(
    institution_client,
    current_month_start,
    current_month_end,
    2800.0,
    2890.2,
    admin_user
  )
  
  if invoice.persisted?
    invoice.update!(status: 'sent')
    puts "✅ Created invoice #{invoice.invoice_number} for #{institution_client.institution_name}"
  end
end

puts "\n🎉 Phase 1 seeding completed successfully!"
puts "\n📊 Database Summary:"
puts "Users: #{User.count}"
puts "User Profiles: #{UserProfile.count}"
puts "Connections: #{Connection.count}"
puts "Meters: #{Meter.count}"
puts "Tariff Rates: #{TariffRate.count}"
puts "Invoices: #{Invoice.count}"
puts "Invoice Line Items: #{InvoiceLineItem.count}"

puts "\n🔑 Test Login Credentials:"
puts "Household Client: +254712345678 / Password123!"
puts "Institution Client: +254723456789 / Password123!"
puts "Admin User: +254734567890 / AdminPass123!"