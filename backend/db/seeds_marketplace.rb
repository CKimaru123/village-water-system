# bundle install && bundle exec rails db:migrate && bundle exec rails r "load 'backend/db/seed_market.rb'" or

# Open your standard db/seeds.rb file in your code editor.
# Add the following line at the top of the file to load the marketplace seeds:
# load 'backend/db/seeds_marketplace.rb'   try this
# load Rails.root.join('backend', 'db', 'seed_market.rb')
# Commit and push this change to GitHub.

# Marketplace Seeds — mirrors the public marketplace page exactly
# Run: rails runner db/seeds_marketplace.rb

puts "🛒 Seeding marketplace..."
admin = User.find_by(email: 'kimarupatriciah@gmail.com')
unless admin; puts "❌ Admin not found."; exit; end

# Helper: find or create a client user
def find_or_create_client(phone:, email:, first:, last:, institution:)
  User.find_by(email: email) || User.create!(
    account_type: 'institution', role: 'client', status: 'active',
    first_name: first, last_name: last,
    institution_name: institution, institution_type: 'other',
    contact_person: "#{first} #{last}",
    phone: phone, email: email,
    password: 'Coll!ns123', password_confirmation: 'Coll!ns123',
    communication_preference: 'Email', newsletter_subscription: false
  )
rescue => e
  puts "  ⚠️  Could not create #{email}: #{e.message}"
  nil
end

c1 = find_or_create_client(phone:'+254711111001', email:'aquasolutions@marketplace.com',
       first:'Aqua', last:'Solutions', institution:'Aqua Solutions Ltd')
c2 = find_or_create_client(phone:'+254711111002', email:'plumbpro@marketplace.com',
       first:'PlumbPro', last:'Kenya', institution:'PlumbPro Kenya')
c3 = find_or_create_client(phone:'+254711111003', email:'pumpmasters@marketplace.com',
       first:'Pump', last:'Masters', institution:'Pump Masters Kenya')
c4 = find_or_create_client(phone:'+254711111004', email:'greenthumb@marketplace.com',
       first:'Green', last:'Thumb', institution:'Green Thumb Irrigation')
c5 = find_or_create_client(phone:'+254711111005', email:'labtech@marketplace.com',
       first:'LabTech', last:'Solutions', institution:'LabTech Solutions')
c6 = find_or_create_client(phone:'+254711111006', email:'purewater@marketplace.com',
       first:'Pure', last:'Water', institution:'Pure Water Systems')
c7 = find_or_create_client(phone:'+254711111007', email:'pipeworks@marketplace.com',
       first:'Pipe', last:'Works', institution:'PipeWorks Kenya')

puts "👥 Client users ready."
MarketplaceItem.destroy_all
puts "🧹 Cleared existing items."

ITEMS = [
  # ── From public marketplace ──────────────────────────────────────────────────
  { title: "Water Storage Tank 1000L",
    description: "High-quality plastic water storage tank with UV protection. Perfect for homes and small businesses. Includes all fittings and installation guide.",
    price: 15000, category: "Water Storage & Tanks",
    seller_name: "Aqua Solutions Ltd", seller_phone: "+254700111111", seller_email: "info@aquasolutions.co.ke",
    location: "Nairobi", rating: 4.5, reviews_count: 23, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600",
             "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400"].to_json,
    specifications: { capacity: "1000L", material: "UV-Protected Plastic", warranty: "2 years",
                      dimensions: "120cm x 100cm x 100cm", colors: ["Blue","Green","White"] }.to_json,
    tags: "water tank, storage, UV protection, household", seller_user: :c1 },

  { title: "Professional Plumbing Services",
    description: "Expert plumbing services for residential and commercial properties. Available 24/7 for emergencies. Licensed and certified plumbers.",
    price: 2500, category: "Plumbing Services",
    seller_name: "PlumbPro Kenya", seller_phone: "+254700222222", seller_email: "info@plumbpro.co.ke",
    location: "Mombasa", rating: 4.8, reviews_count: 45, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
             "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400"].to_json,
    specifications: { service_type: "Installation & Repair", experience: "10+ years",
                      certification: "Licensed Plumber", availability: "24/7 Emergency" }.to_json,
    tags: "plumbing, installation, repair, emergency", seller_user: :c2 },

  { title: "Water Pump 1HP",
    description: "Powerful centrifugal water pump suitable for irrigation and water transfer. Durable cast iron housing. Energy efficient motor with thermal protection.",
    price: 25000, category: "Pumps & Motors",
    seller_name: "Pump Masters Kenya", seller_phone: "+254700333333", seller_email: "sales@pumpmasters.co.ke",
    location: "Kisumu", rating: 4.2, reviews_count: 18, featured: false, in_stock: false,
    images: ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600",
             "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400"].to_json,
    specifications: { power: "1HP (750W)", max_flow: "50 L/min", max_head: "35m", warranty: "1 year" }.to_json,
    tags: "water pump, irrigation, centrifugal, 1HP", seller_user: :c3 },

  { title: "Water Treatment Chemicals",
    description: "Safe and effective water treatment chemicals for household use. Removes impurities and improves water quality. WHO approved formulation.",
    price: 3500, category: "Water Treatment",
    seller_name: "Clean Water Co", seller_phone: "+254700400400", seller_email: "info@cleanwater.co.ke",
    location: "Nakuru", rating: 4.0, reviews_count: 12, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600",
             "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"].to_json,
    specifications: { package_type: "500ml", quantity: "10 bottles", expiry: "2 years", application: "Household" }.to_json,
    tags: "water treatment, chemicals, purification, household", seller_user: nil },

  { title: "Irrigation System Installation",
    description: "Complete irrigation system installation service for gardens and farms. Drip and sprinkler systems available. Covers up to 1 acre.",
    price: 8000, category: "Irrigation Equipment",
    seller_name: "Green Thumb Irrigation", seller_phone: "+254700444444", seller_email: "info@greenthumb.co.ke",
    location: "Eldoret", rating: 4.7, reviews_count: 31, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600",
             "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"].to_json,
    specifications: { system_type: "Drip & Sprinkler", coverage: "Up to 1 acre",
                      warranty: "Installation warranty", maintenance: "Included" }.to_json,
    tags: "irrigation, drip, sprinkler, installation, farming", seller_user: :c4 },

  { title: "Water Quality Testing Kit",
    description: "Professional water testing kit with pH strips, chlorine test, and comprehensive analysis guide. 50 tests per parameter.",
    price: 5500, category: "Water Testing",
    seller_name: "LabTech Solutions", seller_phone: "+254700555555", seller_email: "info@labtech.co.ke",
    location: "Thika", rating: 4.3, reviews_count: 27, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600",
             "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"].to_json,
    specifications: { tests: "pH, Chlorine, Hardness, TDS", kit_size: "50 tests", suitable_for: "Residential" }.to_json,
    tags: "water testing, quality, pH, chlorine, safety", seller_user: :c5 },

  { title: "PVC Water Pipes - Various Sizes",
    description: "High-quality PVC pipes in various sizes for water distribution. Durable and corrosion-resistant. Available in 1/2 inch to 4 inch diameters.",
    price: 1200, category: "Pipes & Fittings",
    seller_name: "PipeWorks Kenya", seller_phone: "+254700777777", seller_email: "sales@pipeworks.co.ke",
    location: "Nairobi", rating: 4.6, reviews_count: 15, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600",
             "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400"].to_json,
    specifications: { material: "PVC", sizes: ["1/2\"","3/4\"","1\"","2\""], length: "6m", pressure: "PN10" }.to_json,
    tags: "PVC pipes, fittings, water distribution, plumbing", seller_user: :c7 },

  { title: "Water Filtration System",
    description: "Advanced multi-stage water filtration system for homes. Removes sediments, chlorine, and impurities. Free installation included.",
    price: 45000, category: "Water Treatment",
    seller_name: "Pure Water Systems", seller_phone: "+254700666666", seller_email: "info@purewater.co.ke",
    location: "Nairobi", rating: 4.9, reviews_count: 52, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600",
             "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400"].to_json,
    specifications: { stages: "5-stage filtration", capacity: "2000L/day", installation: "Free", warranty: "3 years" }.to_json,
    tags: "water filtration, purification, 5-stage, household", seller_user: :c6 },

  # ── Banks / Financial Partners (featured) ────────────────────────────────────
  { title: "Equity Bank - Water Infrastructure Loans",
    description: "Specialized loans for water infrastructure, storage tanks, and water connections. Quick approval within 48 hours. No collateral required for loans up to KES 200,000. Supporting farmers and households access clean water.",
    price: 50000, category: "Agricultural Loans",
    seller_name: "Equity Bank Kenya", seller_phone: "+254700100100", seller_email: "waterloans@equitybank.co.ke",
    location: "Kenya Wide", rating: 4.7, reviews_count: 234, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600",
             "https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400"].to_json,
    specifications: { loan_range: "KES 50,000 - 2,000,000", interest_rate: "9.5% - 15%",
                      repayment: "6 months - 5 years", processing_fee: "2%",
                      eligibility: "18+, Kenyan citizen, income KES 15,000+" }.to_json,
    tags: "bank loan, water financing, tank loan, equity bank", seller_user: nil },

  { title: "KCB Bank - Water Solutions Financing",
    description: "Comprehensive financing for water infrastructure development. Green loan discounts for eco-friendly projects. Supporting communities, farmers, and businesses.",
    price: 200000, category: "Agricultural Loans",
    seller_name: "KCB Bank Kenya", seller_phone: "+254700200200", seller_email: "watersolutions@kcb.co.ke",
    location: "Kenya Wide", rating: 4.8, reviews_count: 312, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600",
             "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400"].to_json,
    specifications: { loan_range: "KES 200,000 - 10,000,000", interest_rate: "7.5% - 13%",
                      repayment: "12 months - 10 years", processing_fee: "1%",
                      eligibility: "Project proposal, budget estimate, registration" }.to_json,
    tags: "KCB bank, water loan, borehole financing, solar pump loan", seller_user: nil },

  { title: "Cooperative Bank - Farmers Water Initiatives",
    description: "Supporting water access initiatives through affordable loans and grants. Special rates for cooperative members. Matching grant program available.",
    price: 100000, category: "Agricultural Loans",
    seller_name: "Cooperative Bank Kenya", seller_phone: "+254700300300", seller_email: "waterinitiatives@coopbank.co.ke",
    location: "Kenya Wide", rating: 4.5, reviews_count: 178, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600",
             "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400"].to_json,
    specifications: { loan_range: "KES 50,000 - 3,000,000", interest_rate: "9% - 15%",
                      repayment: "6 months - 5 years", grace_period: "Up to 6 months",
                      eligibility: "Cooperative membership preferred" }.to_json,
    tags: "cooperative bank, farmers loan, water grant, cooperative", seller_user: nil },

  # ── Companies ────────────────────────────────────────────────────────────────
  { title: "ROTO TANK - Premium Water Storage",
    description: "ROTO TANK premium water storage solutions. UV-stabilized, food-grade polyethylene tanks from 200L to 50,000L. Nationwide delivery and installation. Industry-leading 10-year warranty.",
    price: 18000, category: "Water Storage & Tanks",
    seller_name: "ROTO TANK Kenya", seller_phone: "+254700500500", seller_email: "sales@rototank.co.ke",
    location: "Kenya Wide", rating: 4.9, reviews_count: 189, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600",
             "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400"].to_json,
    specifications: { sizes: "200L to 50,000L", material: "Food-grade polyethylene",
                      warranty: "10 years", uv_protection: "UV-stabilized", delivery: "Nationwide" }.to_json,
    tags: "ROTO TANK, water tank, storage, premium, food grade", seller_user: nil },

  { title: "SIMLAWS - Water Pumps & Irrigation",
    description: "SIMLAWS quality water pumps, irrigation equipment, and water management solutions. Trusted by farmers across Kenya for over 20 years. Full range of submersible, centrifugal, and solar pumps.",
    price: 12000, category: "Pumps & Motors",
    seller_name: "SIMLAWS Kenya", seller_phone: "+254700600600", seller_email: "info@simlaws.co.ke",
    location: "Nairobi", rating: 4.6, reviews_count: 145, featured: true, in_stock: true,
    images: ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600",
             "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400"].to_json,
    specifications: { product_range: "Submersible, Centrifugal, Solar pumps",
                      experience: "20+ years", warranty: "2 years",
                      service_centers: "Nairobi, Mombasa, Kisumu, Eldoret" }.to_json,
    tags: "SIMLAWS, water pump, irrigation, solar pump, submersible", seller_user: nil },

  # ── Farm produce / animals ───────────────────────────────────────────────────
  { title: "Dairy Goats - Improved Breeds",
    description: "High-quality dairy goats (Toggenburg and Alpine breeds) for milk production. Vaccinated, dewormed, and certified disease-free. Includes feeding guide and veterinary support.",
    price: 8000, category: "Farm Animals",
    seller_name: "Burguret Livestock Farm", seller_phone: "+254700700700", seller_email: "livestock@burguretefarm.co.ke",
    location: "Nyeri", rating: 4.4, reviews_count: 28, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600",
             "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=400"].to_json,
    specifications: { breed: "Toggenburg / Alpine", age: "6-12 months",
                      milk_production: "2-3 litres/day", vaccinations: "Up to date" }.to_json,
    tags: "dairy goats, livestock, milk, farming, Toggenburg", seller_user: nil },

  { title: "Organic Kale Seedlings - 500 Pack",
    description: "Healthy organic kale seedlings ready for transplanting. Grown without pesticides. High-yield variety suitable for drip irrigation. Includes planting guide.",
    price: 1500, category: "Farm Products",
    seller_name: "Green Valley Nursery", seller_phone: "+254700800800", seller_email: "nursery@greenvalley.co.ke",
    location: "Kiambu", rating: 4.5, reviews_count: 42, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600",
             "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"].to_json,
    specifications: { quantity: "500 seedlings", variety: "Sukuma Wiki (Kale)",
                      age: "3-4 weeks, ready to transplant", organic: "Yes, pesticide-free" }.to_json,
    tags: "kale, seedlings, organic, vegetables, farming", seller_user: nil },

  { title: "Avocado Trees - Hass Variety",
    description: "Grafted Hass avocado trees, 1-2 years old and ready for planting. High-yield variety with excellent market demand. Suitable for drip irrigation.",
    price: 350, category: "Farm Products",
    seller_name: "Fruit Tree Nursery Kenya", seller_phone: "+254700900900", seller_email: "trees@fruitnursery.co.ke",
    location: "Muranga", rating: 4.6, reviews_count: 67, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
             "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400"].to_json,
    specifications: { variety: "Hass Avocado", age: "1-2 years grafted",
                      yield: "First harvest in 2-3 years", minimum_order: "10 trees" }.to_json,
    tags: "avocado, trees, Hass, fruit trees, farming", seller_user: nil },

  { title: "Garden Hose Set - 30m with Fittings",
    description: "Heavy-duty garden hose 30 meters with complete fitting set. Kink-resistant, UV-stabilized. Includes spray nozzle with 7 patterns and storage reel.",
    price: 3500, category: "Farming Equipment",
    seller_name: "AgriTools Kenya", seller_phone: "+254701000100", seller_email: "tools@agritools.co.ke",
    location: "Nairobi", rating: 4.3, reviews_count: 33, featured: false, in_stock: true,
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600",
             "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"].to_json,
    specifications: { length: "30 meters", material: "Reinforced PVC, kink-resistant",
                      nozzle_patterns: "7 spray patterns", storage: "Includes storage reel" }.to_json,
    tags: "garden hose, irrigation, farming tools, spray nozzle", seller_user: nil },
]

client_map = { c1: c1, c2: c2, c3: c3, c4: c4, c5: c5, c6: c6, c7: c7 }

ITEMS.each do |attrs|
  seller_key = attrs.delete(:seller_user)
  seller = seller_key ? client_map[seller_key] : nil
  item = MarketplaceItem.create!(attrs.merge(created_by: admin, updated_by: admin, seller_user: seller))
  puts "  ✅ #{item.title} (#{item.category})#{seller ? " → #{seller.institution_name}" : ""}"
end

puts "\n🎉 Done! #{MarketplaceItem.count} items | #{MarketplaceItem.featured.count} featured | #{MarketplaceItem.where.not(seller_user_id: nil).count} assigned to clients"
puts "\nClient logins (password: Password123!):"
%w[aquasolutions plumbpro pumpmasters greenthumb labtech purewater pipeworks].each do |n|
  puts "  #{n}@marketplace.com"
end
