# =============================================================================
# Creates a complete test client with connection, meter readings, and billing
# data so the admin can immediately test the full billing workflow.
#
# Run: rails runner db/seeds_test_client.rb
# =============================================================================

puts "🌱 Setting up test client billing data..."

admin = User.where(role: %w[super_admin admin]).first
abort "❌ No admin found. Run db:seed first." unless admin

# ── 1. Tariff rates ───────────────────────────────────────────────────────────
if TariffRate.active.count == 0
  TariffRate.create!([
    { rate_name: 'Household Tier 1 (0–10 m³)',  account_type: 'household',
      tier_min_usage: 0,     tier_max_usage: 10,  rate_per_unit: 25.00,
      fixed_charge: 150.00, effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Household Tier 2 (10–20 m³)', account_type: 'household',
      tier_min_usage: 10.01, tier_max_usage: 20,  rate_per_unit: 35.00,
      fixed_charge: 0,      effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Household Tier 3 (20+ m³)',   account_type: 'household',
      tier_min_usage: 20.01, tier_max_usage: nil, rate_per_unit: 50.00,
      fixed_charge: 0,      effective_date: Date.current.beginning_of_year, is_active: true },
  ])
  puts "✅ Created tariff rates"
end

# ── 2. Global billing config ──────────────────────────────────────────────────
if BillingConfig.global_default.none?
  BillingConfig.create!(
    user_id: nil, billing_mode: 'usage_based',
    tariff_id: TariffRate.active.for_account_type('household').first&.id,
    effective_from: Date.current.beginning_of_year,
    created_by_id: admin.id
  )
  puts "✅ Created global billing config"
end

# ── 3. Test client user ───────────────────────────────────────────────────────
client = User.find_by(email: 'testclient@village-water.com')

unless client
  client = User.create!(
    email:                    'testclient@village-water.com',
    phone:                    '+254711000001',
    alt_phone:                '+254711000002',
    role:                     'client',
    status:                   'active',
    account_type:             'household',
    first_name:               'Collins',
    last_name:                'Kiragu',
    plot_number:              'P-KRG-001',
    household_size:           4,
    village:                  'Kiambu North',
    communication_preference: 'email',
    password:                 'Password123!',
    password_confirmation:    'Password123!'
  )
  puts "✅ Created test client: #{client.display_name} (#{client.email})"
else
  puts "ℹ️  Test client already exists: #{client.display_name}"
end

# ── 4. Connection + meter ─────────────────────────────────────────────────────
connection = client.connections.find_by(connection_status: 'active') || client.connections.first

if connection.nil?
  connection = client.connections.create!(
    connection_date:    6.months.ago.to_date,
    connection_type:    'new',
    service_line_size:  '15mm',
    zone:               'Zone A - Nairobi North',
    meter_type:         'smart_digital',
    meter_status:       'functioning',
    supply_schedule:    '24/7',
    installation_notes: 'Test client connection'
  )
  puts "✅ Created connection: #{connection.connection_number}"
end

if connection.meter.nil?
  connection.create_meter!(
    meter_type:        'smart',
    meter_size:        '15mm',
    installation_date: 6.months.ago.to_date,
    last_reading_date: 1.month.ago.to_date,
    last_reading_value: 1200.0
  ) rescue nil
  puts "✅ Created meter"
end

# ── 5. Meter readings (6 months history) ─────────────────────────────────────
base = 1000.0
consumptions = [11.5, 13.2, 9.8, 14.7, 12.1, 10.5]

6.downto(1).each_with_index do |months_ago, idx|
  period_start = months_ago.months.ago.beginning_of_month.to_date
  period_end   = months_ago.months.ago.end_of_month.to_date
  consumption  = consumptions[idx]
  prev_val     = base.round(2)
  curr_val     = (base + consumption).round(2)
  base         = curr_val

  unless connection.meter_readings.where(reading_date: period_start).exists?
    connection.meter_readings.create!(
      reading_value: prev_val, reading_date: period_start,
      reading_type: 'automatic', recorded_by: admin,
      notes: "Opening reading #{period_start.strftime('%b %Y')}"
    ) rescue nil
  end

  unless connection.meter_readings.where(reading_date: period_end).exists?
    connection.meter_readings.create!(
      reading_value: curr_val, reading_date: period_end,
      reading_type: months_ago.odd? ? 'automatic' : 'manual',
      recorded_by: admin,
      notes: "#{months_ago.odd? ? 'Smart meter' : 'Field officer'} reading #{period_end.strftime('%b %Y')}"
    ) rescue nil
  end
end

puts "✅ Created #{connection.meter_readings.count} meter readings"

# ── 6. Past invoices (months 2–6, all paid) ───────────────────────────────────
billing_config = BillingConfig.effective_for(client)
base2 = 1000.0
consumptions2 = [11.5, 13.2, 9.8, 14.7, 12.1, 10.5]

6.downto(2).each_with_index do |months_ago, idx|
  period_start = months_ago.months.ago.beginning_of_month.to_date
  period_end   = months_ago.months.ago.end_of_month.to_date
  consumption  = consumptions2[idx]
  prev_val     = base2.round(2)
  curr_val     = (base2 + consumption).round(2)
  base2        = curr_val

  next if Invoice.where(user_id: client.id,
                        billing_period_start: period_start,
                        billing_period_end: period_end).exists?

  invoice = Invoice.generate_for_user(
    client, period_start, period_end, prev_val, curr_val, admin,
    billing_config:     billing_config,
    reading_source:     months_ago.odd? ? 'smart_meter' : 'manual',
    field_officer_name: months_ago.even? ? admin.display_name : nil,
    is_estimated:       false
  )

  if invoice.persisted?
    paid_on = period_end + rand(5..15).days
    invoice.update!(status: 'paid', paid_at: paid_on)
    Payment.create!(
      user: client, invoice: invoice,
      amount: invoice.total_amount,
      payment_method: %w[mpesa bank_transfer mpesa].sample,
      transaction_reference: "TXN-#{invoice.invoice_number.delete('-')}-#{rand(100000..999999)}",
      status: 'completed', payment_date: paid_on, notes: 'Paid'
    ) rescue nil
    puts "  ✅ #{period_start.strftime('%b %Y')} — KES #{invoice.total_amount} — PAID"
  end
end

# ── 7. Current month: meter reading exists, NO invoice yet ───────────────────
# This is the state the admin will see: readings exist, invoice not yet generated.
# The admin goes to Invoice Generation, selects this client, and generates the bill.
curr_month_start = Date.current.beginning_of_month
curr_month_end   = Date.current.end_of_month
last_reading_val = connection.meter_readings.order(reading_date: :desc).first&.reading_value || 1071.8
new_reading_val  = (last_reading_val + 13.5).round(2)

unless connection.meter_readings.where(reading_date: Date.current).exists?
  connection.meter_readings.create!(
    reading_value: new_reading_val,
    reading_date:  Date.current,
    reading_type:  'automatic',
    recorded_by:   admin,
    notes:         "Smart meter reading — #{Date.current.strftime('%b %d, %Y')}"
  ) rescue nil
  puts "✅ Created today's meter reading: #{new_reading_val} m³"
end

# ── Summary ───────────────────────────────────────────────────────────────────
puts "\n" + "="*60
puts "📊 TEST CLIENT READY"
puts "="*60
puts "  Name:       #{client.display_name}"
puts "  Email:      #{client.email}"
puts "  Password:   Collins!123"
puts "  Role:       #{client.role}"
puts "  Connection: #{connection.connection_number}"
puts "  Readings:   #{connection.meter_readings.count}"
puts "  Invoices:   #{client.invoices.count} (#{client.invoices.where(status: 'paid').count} paid)"
puts ""
puts "📋 NEXT STEPS:"
puts "  1. Log in as ADMIN"
puts "  2. Go to Finance → Invoice Generation"
puts "  3. Search for '#{client.display_name}' or '#{client.email}'"
puts "  4. Click Generate Invoice — the bill will be created from today's reading"
puts "  5. Log in as CLIENT (#{client.email} / Password123!)"
puts "  6. Go to Billing → Current Bill — the invoice will be visible"
puts "="*60
