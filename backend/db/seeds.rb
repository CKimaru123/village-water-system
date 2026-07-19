# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Create the first admin user if none exists
# if User.admin.count == 0
#   admin = User.create!(
#     account_type: 'household',
#     role: 'admin',
#     status: 'active',
#     first_name: 'System',
#     last_name: 'Administrator',
#     phone: '+254700000000',
#     email: 'admin@village-water-system.com',
#     password: 'AdminPassword123!',
#     password_confirmation: 'AdminPassword123!',
#     alt_phone: '+254700000001',
#     plot_number: 'ADMIN001',
#     household_size: 1,
#     village: 'System',
#     communication_preference: 'Email',
#     landmark: 'System Administration',
#     newsletter_subscription: false
#   )
  
#   puts "✅ Created first admin user:"
#   puts "   Email: #{admin.email}"
#   puts "   Phone: #{admin.phone}"
#   puts "   Password: AdminPassword123!"
#   puts "   Role: #{admin.role}"
#   puts ""
#   puts "⚠️  IMPORTANT: Change the admin password after first login!"
# else
#   puts "ℹ️  Admin users already exist. Skipping admin creation."
# end

puts "🌱 Starting database seeding..."

# ---------------------------------------------------------
# 1. SUPER ADMIN (The ultimate owner, can create admins)
# ---------------------------------------------------------
super_admin = User.find_or_create_by(email: 'kiragucollins@gmail.com') do |user|
  user.account_type = 'household'
  user.role = 'super_admin'
  user.status = 'active'
  user.first_name = 'Collins'
  user.last_name = 'Kiragu'
  user.phone = '+254704363704'
  user.alt_phone = '+254704363704'
  user.password = 'Coll!ns123'
  user.password_confirmation = 'Coll!ns123'
  user.plot_number = 'SUPER001'
  user.household_size = 1
  user.village = 'Headquarters'
  user.communication_preference = 'Email'
  user.landmark = 'Near the shopping center'
  user.newsletter_subscription = false
end

if super_admin.persisted?
  puts "✅ Super Admin ready: #{super_admin.email} | Password: Coll!ns123"
else
  puts "❌ Super Admin failed: #{super_admin.errors.full_messages.join(', ')}"
end

# ---------------------------------------------------------
# 2. STANDARD ADMIN (Daily operations, cannot create other admins)
# ---------------------------------------------------------
admin = User.find_or_create_by(email: 'kimarupatriciah@gmail.com') do |user|
  user.account_type = 'household'
  user.role = 'admin'
  user.status = 'active'
  user.first_name = 'Patriciah'
  user.last_name = 'Njeri'
  user.phone = '+254729552789'
  user.alt_phone = '+254704363704'
  user.password = 'Coll!ns123'
  user.password_confirmation = 'Coll!ns123'
  user.plot_number = 'ADMIN001'
  user.household_size = 1
  user.village = 'Burguret'
  user.communication_preference = 'Email'
  user.landmark = 'Near school'
  user.newsletter_subscription = false
end

if admin.persisted?
  puts "✅ Admin ready: #{admin.email} | Password: Coll!ns123"
else
  puts "❌ Admin failed: #{admin.errors.full_messages.join(', ')}"
end

# ---------------------------------------------------------
# 3. SAMPLE CLIENT (For testing the regular user experience)
# ---------------------------------------------------------
client = User.find_or_create_by(email: 'kimaruwvictoria@gmail.com') do |user|
  user.account_type = 'household'
  user.role = 'client'
  user.status = 'active'
  user.first_name = 'Victoria'
  user.last_name = 'Wanjiku'
  user.phone = '+254758868629'
  user.alt_phone = '+254704363704'
  user.password = 'Coll!ns123'
  user.password_confirmation = 'Coll!ns123'
  user.plot_number = 'PLOT-004'
  user.household_size = 4
  user.village = 'Burguret'
  user.communication_preference = 'SMS'
  user.landmark = 'Near the main junction'
  user.newsletter_subscription = true
end

if client.persisted?
  puts "✅ Sample Client ready: #{client.email} | Password: Coll!ns123"
else
  puts "❌ Client failed: #{client.errors.full_messages.join(', ')}"
end

puts "🌱 Seeding admin, super admin and clientcompleted!"

puts "\n📦 Loading modular seed files..."

# ✅ THE BEST PRACTICE: Use Rails.root.join for absolute, bulletproof paths
# This works perfectly whether you run it locally or on Render!
load Rails.root.join('db', 'seeds_marketplace.rb')
load Rails.root.join('db', 'seeds_connection_billing.rb')

puts "🎉 seeded market place and connection billing"


# ── Seed community polls ──────────────────────────────────────────────────────
admin_user = User.find_by(role: ['admin', 'super_admin'])

if admin_user && Poll.count == 0
  seed_polls = [
    {
      title: "How satisfied are you with the current water supply schedule?",
      description: "Help us understand your experience with our water delivery schedule.",
      category: "Water Supply",
      status: "active",
      options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
    },
    {
      title: "Which water quality issue concerns you most?",
      description: "Your feedback helps us prioritize infrastructure improvements.",
      category: "Water Quality",
      status: "active",
      options: ["Taste / Odour", "Colour / Turbidity", "Pressure Issues", "Contamination Risk", "No Concerns"]
    },
    {
      title: "Would you support a small tariff increase to fund pipe replacement?",
      description: "We are planning a major infrastructure upgrade. Your input matters.",
      category: "Billing & Tariffs",
      status: "active",
      closes_at: 30.days.from_now,
      options: ["Yes, strongly support", "Yes, with conditions", "Neutral", "No, find other funding", "No, oppose any increase"]
    },
    {
      title: "How do you prefer to receive water outage notifications?",
      description: "We want to reach you through your preferred channel.",
      category: "Communication",
      status: "active",
      options: ["SMS / Text", "Email", "WhatsApp", "Notice Board", "All of the above"]
    },
  ]

  seed_polls.each do |poll_data|
    options = poll_data.delete(:options)
    poll = Poll.create!(poll_data.merge(created_by: admin_user))
    options.each { |opt| poll.poll_options.create!(option_text: opt) }
    puts "✅ Created poll: #{poll.title}"
  end
else
  puts "ℹ️  Polls already exist or no admin found. Skipping poll seeds."
end

# ── Seed procurement orders ───────────────────────────────────────────────────
admin_user ||= User.find_by(role: ['admin', 'super_admin'])

if ProcurementOrder.count == 0
  seed_orders = [
    {
      supplier_name: "PipeSupply Kenya",
      total_amount: 185_000,
      order_date: Date.new(2024, 3, 15),
      expected_delivery: Date.new(2024, 4, 5),
      notes: "500m HDPE pipes 110mm for pipeline extension project. Urgent — site work starts April.",
      status: "pending"
    },
    {
      supplier_name: "AquaEquip Ltd",
      total_amount: 95_000,
      order_date: Date.new(2024, 4, 1),
      expected_delivery: Date.new(2024, 4, 20),
      notes: "2x submersible pumps 5HP for borehole replacement. Existing pumps failing.",
      status: "pending"
    },
    {
      supplier_name: "ChemTech EA",
      total_amount: 28_000,
      order_date: Date.new(2024, 4, 10),
      expected_delivery: Date.new(2024, 4, 17),
      notes: "50kg chlorine tablets for monthly water treatment. Recurring monthly order.",
      status: "pending"
    },
    {
      supplier_name: "SolarTech Kenya",
      total_amount: 320_000,
      order_date: Date.new(2024, 4, 12),
      expected_delivery: Date.new(2024, 5, 10),
      notes: "20x 400W solar panels for Zone B solar pump installation project.",
      status: "draft"
    },
    {
      supplier_name: "MeterPro Ltd",
      total_amount: 150_000,
      order_date: Date.new(2024, 3, 28),
      expected_delivery: Date.new(2024, 4, 15),
      notes: "100 water meters for new Zone B connections. Includes installation fittings.",
      status: "approved"
    },
  ]

  seed_orders.each do |attrs|
    order = ProcurementOrder.create!(attrs.merge(created_by: admin_user))
    puts "✅ Created procurement order: #{order.order_number} — #{order.supplier_name} (#{order.status})"
  end
else
  puts "ℹ️  Procurement orders already exist. Skipping."
end

# ── Seed contractors ──────────────────────────────────────────────────────────
admin_user ||= User.find_by(role: ['admin', 'super_admin'])

if Contractor.count == 0
  seed_contractors = [
    {
      name: "James Mwangi",
      company_name: "AquaDrill Ltd",
      specialization: "Borehole Drilling",
      phone: "+254703603230",
      email: "james@aquadrill.co.ke",
      status: "active",
      notes: "Certified borehole driller with 10+ years experience. NCA licensed. Completed 8 boreholes in the region."
    },
    {
      name: "Fatuma Hassan",
      company_name: "SolarTech Kenya",
      specialization: "Solar Pumping Systems",
      phone: "+254703603230",
      email: "fatuma@solartech.co.ke",
      status: "active",
      notes: "ERC-licensed solar engineer. Specializes in off-grid solar water pumping systems. 5 installations completed."
    },
    {
      name: "Peter Otieno",
      company_name: "PipeWorks Co.",
      specialization: "Pipeline Installation",
      phone: "+254703603230",
      email: "peter@pipeworks.co.ke",
      status: "active",
      notes: "Expert in HDPE and GI pipeline systems. NCA/2019/112. Over 15km of pipeline installed."
    },
    {
      name: "Grace Wanjiku",
      company_name: "WaterPure Ltd",
      specialization: "Water Treatment",
      phone: "+254703603230",
      email: "grace@waterpure.co.ke",
      status: "active",
      notes: "WHO-certified water treatment specialist. NEMA licensed. Upgraded 3 treatment plants to WHO standards."
    },
    {
      name: "David Kipchoge",
      company_name: "BuildRight Ltd",
      specialization: "Civil Construction",
      phone: "+254703603230",
      email: "david@buildright.co.ke",
      status: "active",
      notes: "Specializes in elevated storage tanks and civil works. NCA/2018/078. 4 storage tanks constructed."
    },
  ]

  seed_contractors.each do |attrs|
    c = Contractor.create!(attrs.merge(created_by: admin_user))
    puts "✅ Created contractor: #{c.name} — #{c.company_name} (#{c.specialization})"
  end
else
  puts "ℹ️  Contractors already exist. Skipping."
end

# ── Seed projects ─────────────────────────────────────────────────────────────
admin_user ||= User.find_by(role: ['admin', 'super_admin'])

if Project.count == 0 && admin_user
  seed_projects = [
    {
      title: "Kijiji A Borehole Drilling",
      description: "Drilling a 120m borehole to serve 450 households in Kijiji A with clean groundwater.",
      status: "ongoing",
      project_type: "Borehole",
      location: "Kijiji A",
      start_date: Date.new(2024, 2, 1),
      end_date: Date.new(2024, 7, 31),
      budget: 2_800_000,
      gps_latitude: -1.2921,
      gps_longitude: 36.8219
    },
    {
      title: "Solar Pump Installation — Zone B",
      description: "Replace diesel pump with 5kW solar system to cut emissions and operational costs.",
      status: "ongoing",
      project_type: "Solar Pump",
      location: "Zone B",
      start_date: Date.new(2024, 6, 1),
      end_date: Date.new(2024, 9, 30),
      budget: 1_500_000,
      gps_latitude: -1.2850,
      gps_longitude: 36.8300
    },
    {
      title: "Distribution Pipeline Extension",
      description: "Extend 3.2km pipeline to reach underserved areas in the Kijiji C–D corridor.",
      status: "ongoing",
      project_type: "Distribution",
      location: "Kijiji C–D corridor",
      start_date: Date.new(2024, 1, 15),
      end_date: Date.new(2024, 8, 30),
      budget: 980_000,
      gps_latitude: -1.3000,
      gps_longitude: 36.8100
    },
    {
      title: "Water Treatment Plant Upgrade",
      description: "Upgrade chlorination and filtration systems to WHO standards at the central plant.",
      status: "completed",
      project_type: "Treatment",
      location: "Central Treatment Plant",
      start_date: Date.new(2023, 9, 1),
      end_date: Date.new(2024, 1, 31),
      budget: 3_200_000,
      gps_latitude: -1.2960,
      gps_longitude: 36.8180
    },
    {
      title: "Community Storage Tank — Kijiji E",
      description: "Construction of a 50,000L elevated storage tank to improve water pressure and supply.",
      status: "ongoing",
      project_type: "Storage",
      location: "Kijiji E",
      start_date: Date.new(2024, 3, 10),
      end_date: Date.new(2024, 8, 15),
      budget: 1_750_000,
      gps_latitude: -1.3100,
      gps_longitude: 36.8250
    },
  ]

  seed_projects.each do |attrs|
    p = Project.create!(attrs.merge(created_by: admin_user))
    puts "✅ Created project: #{p.title} (#{p.status})"
  end
else
  puts "ℹ️  Projects already exist or no admin found. Skipping."
end

# ── Seed community tasks ──────────────────────────────────────────────────────
admin_user ||= User.find_by(role: ['admin', 'super_admin'])

if CommunityTask.count == 0 && admin_user
  [
    { title: "Monthly pressure check — Zone A", description: "Check water pressure at all Zone A distribution points and report readings.", zone: "Zone A", due_date: Date.new(2025, 6, 1),  priority: "high",   status: "open" },
    { title: "Community meeting facilitation",  description: "Facilitate the monthly community water committee meeting. Prepare agenda and take minutes.", zone: "Zone C", due_date: Date.new(2025, 6, 5),  priority: "normal", status: "open" },
    { title: "Inspect reported leak at Plot 22", description: "Investigate and document the pipe leak reported near Plot 22. Photograph and measure flow rate.", zone: "Zone A", due_date: Date.new(2025, 5, 28), priority: "high",   status: "open" },
    { title: "Water quality observation report", description: "Collect water samples from 5 taps in Zone B and record colour, odour, and turbidity observations.", zone: "Zone B", due_date: Date.new(2025, 6, 10), priority: "low",    status: "open" },
    { title: "Meter reading round — Zone D",    description: "Read all 48 meters in Zone D and submit readings via the portal.", zone: "Zone D", due_date: Date.new(2025, 6, 15), priority: "normal", status: "open" },
  ].each do |attrs|
    t = CommunityTask.create!(attrs.merge(created_by: admin_user))
    puts "✅ Created community task: #{t.title}"
  end
else
  puts "ℹ️  Community tasks already exist or no admin found. Skipping."
end

# # List of all your targeted seed fragments in order
# seed_files = [
#   'db/seeds_billing.rb',
#   'db/seeds_content.rb',
#   'db/seeds_kiragu.rb',
#   'db/seeds_marketplace.rb',
#   'db/seeds_phase1.rb',
#   'db/seeds_test_client.rb'
# ]

# seed_files.each do |file|
#   path = Rails.root.join(file)
  
#   if File.exist?(path)
#     puts "===> Seeding: #{file}..."
#     begin
#       load(path)
#       puts "===> Success: #{file} completed."
#     rescue StandardError => e
#       puts "❌ FAILURE in #{file}: #{e.message}"
#       puts e.backtrace.first(3).join("\n") # Prints the top 3 lines of the crash
#     end
#   else
#     puts "⚠️  Warning: File missing at #{file}"
#   end
#   puts "----------------------------------------"
# end

# # ── Billing seed data ─────────────────────────────────────────────────────────
load Rails.root.join('db/seeds_billing.rb')


