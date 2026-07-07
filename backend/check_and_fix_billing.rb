# Diagnostic + fix script for kiragucollins@gmail.com billing
# Run: rails runner check_and_fix_billing.rb

email = 'kiragucollins@gmail.com'
user  = User.find_by(email: email)

unless user
  puts "❌ User #{email} not found"
  exit
end

puts "=== USER ==="
puts "  ID:     #{user.id}"
puts "  Name:   #{user.display_name}"
puts "  Role:   #{user.role}"
puts "  Status: #{user.status}"

puts "\n=== CONNECTIONS ==="
if user.connections.empty?
  puts "  ❌ No connections found"
else
  user.connections.each do |c|
    puts "  #{c.connection_number} | status=#{c.connection_status} | zone=#{c.zone}"
  end
end

puts "\n=== INVOICES ==="
if user.invoices.empty?
  puts "  ❌ No invoices found — seed has not been run yet"
else
  user.invoices.order(created_at: :desc).each do |inv|
    puts "  #{inv.invoice_number} | #{inv.billing_period} | KES #{inv.total_amount} | status=#{inv.status}"
  end
end

puts "\n=== UNPAID INVOICES (what current_bill looks for) ==="
unpaid = user.invoices.unpaid
if unpaid.empty?
  puts "  ❌ No unpaid invoices — this is why the page shows 'no outstanding bills'"
else
  unpaid.each { |i| puts "  #{i.invoice_number} | #{i.billing_period} | #{i.status}" }
end

# ── Fix: ensure the most recent invoice is 'sent' (unpaid) ───────────────────
puts "\n=== FIX ==="
latest = user.invoices.order(billing_period_end: :desc).first

if latest.nil?
  puts "No invoices at all — running billing seed now..."
  load Rails.root.join('db/seeds_kiragu.rb')
elsif latest.status == 'paid'
  puts "Most recent invoice #{latest.invoice_number} is 'paid' — setting to 'sent' so it shows as current bill"
  latest.update!(status: 'sent', paid_at: nil)
  puts "✅ Fixed: #{latest.invoice_number} is now 'sent'"
elsif latest.status == 'sent'
  puts "✅ Invoice #{latest.invoice_number} is already 'sent' — should show in current bill"
  puts "   Check that the frontend is calling /client/current_bill (not /invoices/current)"
else
  puts "Invoice status is '#{latest.status}' — setting to 'sent'"
  latest.update!(status: 'sent')
  puts "✅ Fixed"
end

puts "\n=== FINAL STATE ==="
puts "Unpaid invoices: #{user.invoices.unpaid.count}"
user.invoices.unpaid.each { |i| puts "  #{i.invoice_number} | #{i.billing_period} | KES #{i.total_amount} | #{i.status}" }
