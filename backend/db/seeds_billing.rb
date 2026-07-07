# =============================================================================
# Billing Seed Data
# Adds realistic meter readings, invoices, payments, billing configs, and
# subsidies for existing client users.
# Run with: rails runner db/seeds_billing.rb
# Or append to seeds.rb and run: rails db:seed
# =============================================================================

puts "\n💧 Seeding billing data..."

admin = User.find_by(role: %w[super_admin admin])
unless admin
  puts "⚠️  No admin user found. Run seeds.rb first."
  exit
end

# ── 1. Tariff Rates ──────────────────────────────────────────────────────────
if TariffRate.count == 0
  puts "Creating tariff rates..."
  TariffRate.create!([
    { rate_name: 'Household Tier 1 (0–10 m³)',  account_type: 'household',    tier_min_usage: 0,     tier_max_usage: 10,  rate_per_unit: 25.00, fixed_charge: 150.00, effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Household Tier 2 (10–20 m³)', account_type: 'household',    tier_min_usage: 10.01, tier_max_usage: 20,  rate_per_unit: 35.00, fixed_charge: 0,      effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Household Tier 3 (20+ m³)',   account_type: 'household',    tier_min_usage: 20.01, tier_max_usage: nil, rate_per_unit: 50.00, fixed_charge: 0,      effective_date: Date.current.beginning_of_year, is_active: true },
    { rate_name: 'Institution Standard',         account_type: 'institution',  tier_min_usage: 0,     tier_max_usage: nil, rate_per_unit: 45.00, fixed_charge: 300.00, effective_date: Date.current.beginning_of_year, is_active: true },
  ])
  puts "✅ Created #{TariffRate.count} tariff rates"
else
  puts "ℹ️  Tariff rates already exist (#{TariffRate.count})"
end

# ── 2. Global Billing Config ─────────────────────────────────────────────────
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

# ── 3. Ensure client users exist ─────────────────────────────────────────────
clients = User.where(role: 'client').includes(:connections)

if clients.empty?
  puts "⚠️  No client users found. Creating sample clients..."

  [
    { first_name: 'John',  last_name: 'Doe',    phone: '+254712345678', email: 'john.doe@example.com',       account_type: 'household',   plot_number: 'P001', village: 'Kiambu North', zone: 'Zone A' },
    { first_name: 'Mary',  last_name: 'Wanjiku', phone: '+254723456789', email: 'mary.wanjiku@example.com',  account_type: 'household',   plot_number: 'P002', village: 'Kiambu South', zone: 'Zone B' },
    { first_name: 'Peter', last_name: 'Otieno',  phone: '+254734567890', email: 'peter.otieno@example.com',  account_type: 'household',   plot_number: 'P003', village: 'Kiambu East',  zone: 'Zone A' },
  ].each do |attrs|
    zone = attrs.delete(:zone)
    user = User.find_or_create_by(phone: attrs[:phone]) do |u|
      u.assign_attributes(attrs.merge(role: 'client', status: 'active', household_size: 4,
        communication_preference: 'sms', password: 'Password123!'))
    end
    next unless user.persisted? && user.connections.empty?

    conn = user.connections.create!(
      connection_date: 8.months.ago.to_date,
      connection_type: 'new',
      service_line_size: '15mm',
      zone: zone,
      meter_type: 'smart_digital',
      meter_status: 'functioning',
      installation_notes: 'Standard household connection'
    )
    conn.create_meter!(
      meter_type: 'smart',
      meter_size: '15mm',
      installation_date: 8.months.ago.to_date,
      last_reading_date: 1.month.ago.to_date,
      last_reading_value: rand(800..2000).to_f
    ) rescue nil
    puts "  ✅ Created client #{user.display_name}"
  end

  clients = User.where(role: 'client').includes(:connections)
end

# ── 4. Meter Readings + Invoices + Payments per client ───────────────────────
clients.each do |client|
  connection = client.connections.find_by(connection_status: 'active') || client.connections.first
  next unless connection

  puts "\n  👤 #{client.display_name} (#{client.account_type})"

  # Resolve billing config
  billing_config = BillingConfig.effective_for(client)

  # Starting meter value — use existing or pick a realistic base
  base_reading = connection.meter_readings.order(reading_date: :desc).first&.reading_value || rand(500..1500).to_f

  # Generate 6 months of readings + invoices
  6.downto(1) do |months_ago|
    period_start = months_ago.months.ago.beginning_of_month.to_date
    period_end   = months_ago.months.ago.end_of_month.to_date

    # Skip if invoice already exists for this period
    next if Invoice.where(user_id: client.id,
                          billing_period_start: period_start,
                          billing_period_end: period_end).exists?

    # Monthly consumption: household 8–22 m³, institution 40–90 m³
    consumption = client.account_type == 'institution' ? rand(40.0..90.0).round(2) : rand(8.0..22.0).round(2)

    prev_value    = base_reading
    current_value = (base_reading + consumption).round(2)
    base_reading  = current_value  # carry forward

    # Create start-of-period reading
    unless connection.meter_readings.where(reading_date: period_start).exists?
      connection.meter_readings.create!(
        reading_value: prev_value,
        reading_date:  period_start,
        reading_type:  'automatic',
        recorded_by:   admin,
        notes:         "Auto reading — start of #{period_start.strftime('%B %Y')}"
      ) rescue nil
    end

    # Create end-of-period reading
    unless connection.meter_readings.where(reading_date: period_end).exists?
      connection.meter_readings.create!(
        reading_value: current_value,
        reading_date:  period_end,
        reading_type:  months_ago.odd? ? 'automatic' : 'manual',
        recorded_by:   admin,
        notes:         "#{months_ago.odd? ? 'Smart meter' : 'Field officer'} reading — end of #{period_end.strftime('%B %Y')}"
      ) rescue nil
    end

    # Generate invoice
    reading_source     = months_ago.odd? ? 'smart_meter' : 'manual'
    field_officer_name = reading_source == 'manual' ? admin.display_name : nil

    invoice = Invoice.generate_for_user(
      client,
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
      puts "    ⚠️  Invoice skipped: #{invoice.errors.full_messages.join(', ')}"
      next
    end

    # Mark older invoices as paid, most recent as sent/overdue
    if months_ago >= 2
      invoice.update!(status: 'paid', paid_at: period_end + rand(5..20).days)

      # Create matching payment record
      Payment.create!(
        user:                  client,
        invoice:               invoice,
        amount:                invoice.total_amount,
        payment_method:        %w[mpesa bank_transfer cash].sample,
        transaction_reference: "TXN-#{invoice.invoice_number}-#{rand(100000..999999)}",
        status:                'completed',
        payment_date:          invoice.paid_at,
        notes:                 'Payment recorded'
      ) rescue nil
    else
      invoice.update!(status: 'sent')
    end

    puts "    ✅ Invoice #{invoice.invoice_number} — #{period_start.strftime('%b %Y')} — KES #{invoice.total_amount.to_f.round(2)} (#{invoice.status})"
  end
end

# ── 5. Subsidy for one client ─────────────────────────────────────────────────
elderly_client = User.where(role: 'client').first
if elderly_client && Subsidy.where(user: elderly_client).none?
  Subsidy.create!(
    user:               elderly_client,
    subsidy_type:       'percentage',
    percentage_discount: 20.0,
    reason:             'Elderly resident — age 72, fixed income',
    status:             'approved',
    approved_by:        admin,
    approved_at:        1.month.ago,
    valid_from:         Date.current.beginning_of_year,
    valid_until:        nil
  )
  puts "\n✅ Created 20% subsidy for #{elderly_client.display_name}"
end

# ── 6. Summary ────────────────────────────────────────────────────────────────
puts "\n📊 Billing Seed Summary:"
puts "  Tariff Rates:    #{TariffRate.count}"
puts "  Billing Configs: #{BillingConfig.count}"
puts "  Meter Readings:  #{MeterReading.count}"
puts "  Invoices:        #{Invoice.count} (#{Invoice.where(status: 'paid').count} paid, #{Invoice.where(status: 'sent').count} sent)"
puts "  Payments:        #{Payment.count}"
puts "  Subsidies:       #{Subsidy.count}"
puts "\n✅ Billing seed complete!"
