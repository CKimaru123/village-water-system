# ---------------------------------------------------------
# 3. SAMPLE CLIENT (With rich testing data: Connection, Meter, Readings, Invoices)
# ---------------------------------------------------------
client = User.find_or_create_by(email: 'kimaruwvictoria@gmail.com') do |user|
  user.account_type = 'household'
  user.role = 'client'
  user.status = 'active'
  user.first_name = 'Victoria'
  user.last_name = 'Wanjiku'
  user.phone = '+254712345678'
  user.password = 'Collins!123'
  user.password_confirmation = 'Collins!123'
  user.plot_number = 'PLOT-042'
  user.household_size = 4
  user.village = 'Kileleshwa'
  user.communication_preference = 'SMS'
  user.landmark = 'Near the main junction'
  user.newsletter_subscription = true
end

if client.persisted?
  puts "✅ Sample Client ready: #{client.email} | Password: Collins!123"
  
  # Ensure we have an admin to assign as 'recorded_by' for readings/invoices
  admin = User.find_by(role: 'admin') || User.find_by(role: 'super_admin') || client

  # ── 1. Connection ─────────────────────────────────────────────────────────────
  connection = client.connections.find_by(connection_status: 'active') || client.connections.first
  if connection.nil?
    connection = client.connections.create!(
      connection_date:    6.months.ago.to_date,
    #   connection_type:    'new',
      connection_type:    'domestic', # ✅ CORRECT (matches model validation)
      service_line_size:  '15mm',
      zone:               'Zone A - Nairobi North',
      meter_type:         'smart_digital',
      meter_status:       'functioning',
      supply_schedule:    '24/7',
      installation_notes: 'Test client connection'
    )
    puts "✅ Created connection: #{connection.connection_number}"
  else
    puts "ℹ️ Connection already exists: #{connection.connection_number}"
  end

  if connection
    # ── 2. Meter ──────────────────────────────────────────────────────────────────
    if connection.meter.nil?
      connection.create_meter!(
        meter_type:        'smart',
        meter_size:        '15mm',
        installation_date: 6.months.ago.to_date,
        last_reading_date: 1.month.ago.to_date,
        last_reading_value: 1200.0
      )
      puts "✅ Created meter for connection"
    end

    # ── 3. Meter readings (6 months history) ─────────────────────────────────────
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
    puts "✅ Created/Verified #{connection.meter_readings.count} meter readings"

    # ── 4. Past invoices (months 2–6, all paid) ───────────────────────────────────
    billing_config = BillingConfig.effective_for(client) rescue BillingConfig.first
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

      # Generate invoice (with fallback if method signature varies slightly)
      if Invoice.respond_to?(:generate_for_user)
        invoice = Invoice.generate_for_user(
          client, period_start, period_end, prev_val, curr_val, admin,
          billing_config:     billing_config,
          reading_source:     months_ago.odd? ? 'smart_meter' : 'manual',
          field_officer_name: months_ago.even? ? (admin.first_name + ' ' + admin.last_name) : nil,
          is_estimated:       false
        )
      else
        invoice = Invoice.new(
          user: client,
          billing_period_start: period_start,
          billing_period_end: period_end,
          previous_reading: prev_val,
          current_reading: curr_val,
          recorded_by: admin
        )
        invoice.save
      end

      if invoice && invoice.persisted?
        paid_on = period_end + rand(5..15).days
        invoice.update!(status: 'paid', paid_at: paid_on)
        Payment.create!(
          user: client, invoice: invoice,
          amount: invoice.total_amount,
          payment_method: %w[mpesa bank_transfer mpesa].sample,
          transaction_reference: "TXN-#{invoice.invoice_number.to_s.delete('-')}-#{rand(100000..999999)}",
          status: 'completed', payment_date: paid_on, notes: 'Paid'
        ) rescue nil
        puts "  ✅ #{period_start.strftime('%b %Y')} — KES #{invoice.total_amount} — PAID"
      end
    end

    # ── 5. Current month: meter reading exists, NO invoice yet ───────────────────
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
  end

  # ── Summary ───────────────────────────────────────────────────────────────────
  puts "\n" + "="*60
  puts "📊 TEST CLIENT READY"
  puts "="*60
  puts "  Name:       #{client.first_name} #{client.last_name}"
  puts "  Email:      #{client.email}"
  puts "  Password:   Collins!123"
  puts "  Role:       #{client.role}"
  puts "  Connection: #{connection&.connection_number || 'None'}"
  puts "  Readings:   #{connection&.meter_readings&.count || 0}"
  puts "  Invoices:   #{client.invoices.count} (#{client.invoices.where(status: 'paid').count} paid)"
  puts "="*60 + "\n"
else
  puts "❌ Client failed: #{client.errors.full_messages.join(', ')}"
end