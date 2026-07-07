# =============================================================================
# Billing seed for kiragucollins@gmail.com
# Run: rails runner db/seeds_kiragu.rb
# =============================================================================

puts "🌱 Seeding billing data for kiragucollins@gmail.com..."

# ── Find or create the user ───────────────────────────────────────────────────
user = User.find_by(email: 'kiragucollins@gmail.com')

unless user
  puts "User not found — creating kiragucollins@gmail.com as a client..."
  user = User.create!(
    email:                    'kiragucollins@gmail.com',
    phone:                    '+254700000099',
    role:                     'client',
    status:                   'active',
    account_type:             'household',
    first_name:               'Collins',
    last_name:                'Kiragu',
    plot_number:              'P099',
    household_size:           4,
    village:                  'Kiambu',
    communication_preference: 'email',
    password:                 'Password123!',
    password_confirmation:    'Password123!'
  )
  puts "✅ Created user: #{user.display_name}"
else
  puts "✅ Found existing user: #{user.display_name} | role=#{user.role} | status=#{user.status}"
end

# Ensure the user is a client
if user.role != 'client'
  puts "⚠️  User role is '#{user.role}' — updating to 'client' for billing demo"
  user.update!(role: 'client')
end

admin = User.find_by(role: %w[super_admin admin])
raise "No admin user found. Run db:seed first." unless admin

# ── Ensure tariff rates exist ─────────────────────────────────────────────────
if TariffRate.active.count == 0
  puts "Creating tariff rates..."
  TariffRate.create!([
    { rate_name: 'Household Tier 1 (0–10 m³)',  account_type: 'household',   tier_min_usage: 0,     tier_max_usage: 10,  rate_per_unit: 25.00, fixed_charge: 150.00, effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Household Tier 2 (10–20 m³)', account_type: 'household',   tier_min_usage: 10.01, tier_max_usage: 20,  rate_per_unit: 35.00, fixed_charge: 0,      effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Household Tier 3 (20+ m³)',   account_type: 'household',   tier_min_usage: 20.01, tier_max_usage: nil, rate_per_unit: 50.00, fixed_charge: 0,      effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Institution Standard',         account_type: 'institution', tier_min_usage: 0,     tier_max_usage: nil, rate_per_unit: 45.00, fixed_charge: 300.00, effective_date: Date.current.beginning_of_year, is_active: true },
  ])
  puts "✅ Created #{TariffRate.count} tariff rates"
end

# ── Ensure global billing config exists ──────────────────────────────────────
if BillingConfig.global_default.none?
  BillingConfig.create!(
    user_id:        nil,
    billing_mode:   'usage_based',
    tariff_id:      TariffRate.active.for_account_type('household').first&.id,
    effective_from: Date.current.beginning_of_year,
    created_by_id:  admin.id
  )
  puts "✅ Created global billing config (usage_based)"
end

# ── Ensure connection + meter exist ──────────────────────────────────────────
connection = user.connections.find_by(connection_status: 'active') || user.connections.first

if connection.nil?
  puts "Creating connection and meter for #{user.display_name}..."
  connection = user.connections.create!(
    connection_date:    8.months.ago.to_date,
    connection_type:    'new',
    service_line_size:  '15mm',
    zone:               'Zone A - Nairobi North',
    meter_type:         'smart_digital',
    meter_status:       'functioning',
    supply_schedule:    '24/7',
    installation_notes: 'Standard household connection'
  )
  puts "✅ Created connection #{connection.connection_number}"
end

# Create meter if missing
if connection.meter.nil?
  connection.create_meter!(
    meter_type:         'smart',
    meter_size:         '15mm',
    installation_date:  8.months.ago.to_date,
    last_reading_date:  1.month.ago.to_date,
    last_reading_value: 1200.0
  ) rescue nil
  puts "✅ Created meter for connection"
end

# ── Generate 6 months of meter readings + invoices + payments ────────────────
billing_config = BillingConfig.effective_for(user)
base_reading   = connection.meter_readings.order(reading_date: :desc).first&.reading_value || 1200.0

# Monthly consumption pattern (realistic household: 8–18 m³/month)
monthly_consumptions = [12.5, 9.8, 15.2, 11.0, 13.7, 10.3]

6.downto(1).each_with_index do |months_ago, idx|
  period_start = months_ago.months.ago.beginning_of_month.to_date
  period_end   = months_ago.months.ago.end_of_month.to_date

  # Skip if invoice already exists
  if Invoice.where(user_id: user.id, billing_period_start: period_start, billing_period_end: period_end).exists?
    puts "  ℹ️  Invoice already exists for #{period_start.strftime('%B %Y')} — skipping"
    next
  end

  consumption   = monthly_consumptions[idx]
  prev_value    = base_reading.round(2)
  current_value = (base_reading + consumption).round(2)
  base_reading  = current_value

  # Reading source alternates: smart meter for odd months, manual for even
  reading_source     = months_ago.odd? ? 'smart_meter' : 'manual'
  field_officer_name = reading_source == 'manual' ? admin.display_name : nil

  # Create start-of-period reading
  unless connection.meter_readings.where(reading_date: period_start).exists?
    connection.meter_readings.create!(
      reading_value: prev_value,
      reading_date:  period_start,
      reading_type:  'automatic',
      recorded_by:   admin,
      notes:         "Opening reading — #{period_start.strftime('%B %Y')}"
    ) rescue nil
  end

  # Create end-of-period reading
  unless connection.meter_readings.where(reading_date: period_end).exists?
    connection.meter_readings.create!(
      reading_value: current_value,
      reading_date:  period_end,
      reading_type:  reading_source == 'smart_meter' ? 'automatic' : 'manual',
      recorded_by:   admin,
      notes:         "#{reading_source == 'smart_meter' ? 'Smart meter auto-read' : 'Field officer manual read'} — #{period_end.strftime('%B %Y')}"
    ) rescue nil
  end

  # Generate invoice
  invoice = Invoice.generate_for_user(
    user,
    period_start,
    period_end,
    prev_value,
    current_value,
    admin,
    billing_config:     billing_config,
    subsidy:            nil,
    reading_source:     reading_source,
    field_officer_name: field_officer_name,
    is_estimated:       false
  )

  unless invoice.persisted?
    puts "  ⚠️  Invoice failed: #{invoice.errors.full_messages.join(', ')}"
    next
  end

  # Months 2–6 are paid; month 1 (most recent) stays as 'sent' = current bill
  if months_ago >= 2
    paid_on = period_end + rand(5..18).days
    invoice.update!(status: 'paid', paid_at: paid_on)

    Payment.create!(
      user:                  user,
      invoice:               invoice,
      amount:                invoice.total_amount,
      payment_method:        %w[mpesa bank_transfer mpesa mpesa cash].sample,
      transaction_reference: "TXN-#{invoice.invoice_number.gsub('-', '')}-#{rand(100000..999999)}",
      status:                'completed',
      payment_date:          paid_on,
      notes:                 'Payment confirmed'
    ) rescue nil

    puts "  ✅ #{period_start.strftime('%b %Y')} — KES #{invoice.total_amount.to_f.round(2)} — PAID (#{reading_source})"
  else
    invoice.update!(status: 'sent')
    puts "  ✅ #{period_start.strftime('%b %Y')} — KES #{invoice.total_amount.to_f.round(2)} — CURRENT BILL (#{reading_source})"
  end
end

# ── Summary ───────────────────────────────────────────────────────────────────
puts "\n📊 Summary for #{user.display_name}:"
puts "  Connection:     #{connection.connection_number}"
puts "  Meter readings: #{connection.meter_readings.count}"
puts "  Invoices:       #{user.invoices.count} (#{user.invoices.where(status: 'paid').count} paid, #{user.invoices.where(status: 'sent').count} current)"
puts "  Payments:       #{user.payments.count}"
puts "\n🔑 Login: kiragucollins@gmail.com"
puts "   Password: (use existing password or reset via admin)"
puts "\n✅ Done!"
