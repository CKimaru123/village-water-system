# Force-creates a current bill for kiragucollins@gmail.com
# Run: rails runner force_bill.rb

user = User.find_by(email: 'kiragucollins@gmail.com')
abort "User not found" unless user

puts "User: #{user.display_name} | role=#{user.role} | invoices=#{user.invoices.count}"

admin = User.find_by(role: %w[super_admin admin])
abort "No admin found" unless admin

# Ensure tariff rates
if TariffRate.active.count == 0
  TariffRate.create!(
    rate_name: 'Household Standard', account_type: 'household',
    tier_min_usage: 0, tier_max_usage: nil,
    rate_per_unit: 25.00, fixed_charge: 150.00,
    effective_date: Date.current.beginning_of_year, is_active: true
  )
end

# Ensure global billing config
if BillingConfig.global_default.none?
  BillingConfig.create!(
    user_id: nil, billing_mode: 'usage_based',
    tariff_id: TariffRate.active.first&.id,
    effective_from: Date.current.beginning_of_year,
    created_by_id: admin.id
  )
end

# Ensure connection
connection = user.connections.first
if connection.nil?
  connection = user.connections.create!(
    connection_date: 6.months.ago.to_date,
    connection_type: 'new',
    service_line_size: '15mm',
    zone: 'Zone A',
    meter_type: 'smart_digital',
    meter_status: 'functioning',
    installation_notes: 'Auto-created for billing demo'
  )
  puts "Created connection: #{connection.connection_number}"
end

# Delete any existing unpaid invoices so we start fresh
user.invoices.where(status: %w[draft sent]).destroy_all

# Create a current bill directly
period_start = 1.month.ago.beginning_of_month.to_date
period_end   = 1.month.ago.end_of_month.to_date
prev_val     = 1200.0
curr_val     = 1213.5  # 13.5 m³ consumption

billing_config = BillingConfig.effective_for(user)

invoice = Invoice.generate_for_user(
  user, period_start, period_end,
  prev_val, curr_val, admin,
  billing_config:     billing_config,
  reading_source:     'smart_meter',
  field_officer_name: nil,
  is_estimated:       false
)

if invoice.persisted?
  invoice.update!(status: 'sent')
  puts "✅ Invoice created: #{invoice.invoice_number}"
  puts "   Period: #{invoice.billing_period}"
  puts "   Amount: KES #{invoice.total_amount}"
  puts "   Status: #{invoice.status}"
  puts "   Line items: #{invoice.invoice_line_items.count}"
else
  puts "❌ Failed: #{invoice.errors.full_messages.join(', ')}"
end
