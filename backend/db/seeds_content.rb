# Content Management Seeds
# Run with: rails runner db/seeds_content.rb

puts "🌱 Seeding content management data..."

# Find or create admin user
admin_user = User.find_by(email: 'admin@village-water-system.com')
if admin_user.nil?
  puts "❌ Admin user not found. Please run rails db:seed first."
  exit
end

puts "👤 Using admin user: #{admin_user.email}"

# Clear existing data
puts "🧹 Clearing existing content..."
GalleryItem.destroy_all
MarketplaceItem.destroy_all
BlogPost.destroy_all

# Gallery Items
puts "📸 Creating gallery items..."

gallery_items = [
  {
    title: "Water Tank Installation - Burguret Village",
    description: "New 5000L water storage tank installed to serve 50 households in Burguret village center.",
    large_image_url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800",
    small_image_url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400",
    category: "Water Infrastructure",
    tags: "water tank, installation, community, storage",
    featured: true,
    sort_order: 1
  },
  {
    title: "Community Training on Water Conservation",
    description: "Local farmers learning water-efficient irrigation techniques and rainwater harvesting methods.",
    large_image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",
    small_image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
    category: "Training Sessions",
    tags: "training, conservation, farmers, education",
    featured: true,
    sort_order: 2
  },
  {
    title: "Drip Irrigation System Success",
    description: "Successful implementation of drip irrigation system increasing crop yield by 40% while reducing water usage.",
    large_image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800",
    small_image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400",
    category: "Agricultural Projects",
    tags: "irrigation, drip system, crops, efficiency",
    featured: false,
    sort_order: 3
  },
  {
    title: "Water Quality Testing Workshop",
    description: "Community members learning to test water quality using simple testing kits and understanding water safety.",
    large_image_url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    small_image_url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400",
    category: "Training Sessions",
    tags: "water quality, testing, safety, workshop",
    featured: false,
    sort_order: 4
  },
  {
    title: "Solar Water Pump Installation",
    description: "Solar-powered water pump installed to provide reliable water access for livestock and irrigation.",
    large_image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
    small_image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400",
    category: "Equipment Installation",
    tags: "solar pump, renewable energy, livestock, irrigation",
    featured: true,
    sort_order: 5
  },
  {
    title: "Tree Planting for Watershed Protection",
    description: "Community tree planting initiative to protect water sources and prevent soil erosion.",
    large_image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    small_image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
    category: "Environmental Conservation",
    tags: "trees, watershed, conservation, community",
    featured: false,
    sort_order: 6
  }
]

gallery_items.each do |item_data|
  item = GalleryItem.create!(
    item_data.merge(
      created_by: admin_user,
      updated_by: admin_user
    )
  )
  puts "  ✅ Created gallery item: #{item.title}"
end

# Marketplace Items
puts "🛒 Creating marketplace items..."

marketplace_items = [
  {
    title: "Water Storage Tank 1000L - UV Protected",
    description: "High-quality plastic water storage tank with UV protection. Perfect for homes and small businesses. Includes all fittings and installation guide.",
    price: 15000.00,
    category: "Water Storage & Tanks",
    seller_name: "Aqua Solutions Ltd",
    seller_phone: "+254700111111",
    seller_email: "info@aquasolutions.co.ke",
    location: "Nairobi",
    images: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400"
    ].to_json,
    rating: 4.5,
    reviews_count: 23,
    featured: true,
    in_stock: true,
    specifications: {
      capacity: "1000L",
      material: "UV-Protected Plastic",
      warranty: "2 years",
      dimensions: "120cm x 100cm x 100cm",
      colors: ["Blue", "Green", "White"]
    }.to_json,
    tags: "water tank, storage, UV protection, household"
  },
  {
    title: "Professional Plumbing Services - 24/7",
    description: "Expert plumbing services for residential and commercial properties. Specializing in water system installation, repair, and maintenance. Available 24/7 for emergencies.",
    price: 2500.00,
    category: "Plumbing Services",
    seller_name: "PlumbPro Kenya",
    seller_phone: "+254700222222",
    seller_email: "info@plumbpro.co.ke",
    location: "Mombasa",
    images: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400"
    ].to_json,
    rating: 4.8,
    reviews_count: 45,
    featured: true,
    in_stock: true,
    specifications: {
      service_type: "Installation & Repair",
      experience: "10+ years",
      certification: "Licensed Plumber",
      availability: "24/7 Emergency Service"
    }.to_json,
    tags: "plumbing, installation, repair, emergency, professional"
  },
  {
    title: "Centrifugal Water Pump 1HP",
    description: "Powerful centrifugal water pump suitable for irrigation and water transfer. Durable construction with cast iron housing. Energy efficient motor.",
    price: 25000.00,
    category: "Pumps & Motors",
    seller_name: "Pump Masters Kenya",
    seller_phone: "+254700333333",
    seller_email: "sales@pumpmasters.co.ke",
    location: "Kisumu",
    images: [
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600",
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400"
    ].to_json,
    rating: 4.2,
    reviews_count: 18,
    featured: false,
    in_stock: true,
    specifications: {
      power: "1HP (750W)",
      max_flow: "50 L/min",
      max_head: "35 meters",
      warranty: "1 year manufacturer warranty"
    }.to_json,
    tags: "water pump, irrigation, centrifugal, 1HP, farming"
  },
  {
    title: "Drip Irrigation Kit - Complete System",
    description: "Complete drip irrigation system for small to medium farms. Includes drippers, tubing, filters, and pressure regulators. Easy to install and maintain.",
    price: 8500.00,
    category: "Irrigation Equipment",
    seller_name: "Green Thumb Irrigation",
    seller_phone: "+254700444444",
    seller_email: "info@greenthumb.co.ke",
    location: "Eldoret",
    images: [
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600",
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400"
    ].to_json,
    rating: 4.7,
    reviews_count: 31,
    featured: true,
    in_stock: true,
    specifications: {
      coverage_area: "Up to 1 acre",
      dripper_spacing: "30cm intervals",
      flow_rate: "2-4 L/hour per dripper",
      includes: "Tubing, drippers, filters, connectors"
    }.to_json,
    tags: "drip irrigation, farming, water efficient, complete kit"
  },
  {
    title: "Water Quality Testing Kit - Professional",
    description: "Professional water testing kit with pH strips, chlorine test, hardness test, and comprehensive analysis guide. Perfect for household and small business use.",
    price: 5500.00,
    category: "Water Testing",
    seller_name: "LabTech Solutions",
    seller_phone: "+254700555555",
    seller_email: "info@labtech.co.ke",
    location: "Thika",
    images: [
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600",
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400"
    ].to_json,
    rating: 4.3,
    reviews_count: 27,
    featured: false,
    in_stock: true,
    specifications: {
      tests_included: "pH, Chlorine, Hardness, TDS, Bacteria",
      kit_size: "50 tests per parameter",
      suitable_for: "Household and commercial use",
      instructions: "Detailed manual included"
    }.to_json,
    tags: "water testing, quality, pH, chlorine, safety"
  }
]

marketplace_items.each do |item_data|
  item = MarketplaceItem.create!(
    item_data.merge(
      created_by: admin_user,
      updated_by: admin_user
    )
  )
  puts "  ✅ Created marketplace item: #{item.title}"
end

# Blog Posts
puts "📝 Creating blog posts..."

blog_posts = [
  {
    title: "Essential Water Storage Solutions for Rural Households",
    excerpt: "Discover practical and affordable water storage options that can transform water security for rural families. From simple containers to advanced tank systems.",
    content: "Water storage is a critical component of household water security, especially in rural areas where access to piped water may be limited or unreliable. This comprehensive guide explores various water storage solutions suitable for different household sizes and budgets.\n\n## Why Water Storage Matters\n\nReliable water storage ensures that families have access to clean water during dry seasons, system maintenance, or unexpected supply interruptions. Proper storage also allows households to take advantage of rainwater harvesting and bulk water purchases.\n\n## Storage Options by Capacity\n\n### Small Household Solutions (20-200L)\n- Jerrycans and containers\n- Ceramic water pots\n- Food-grade plastic drums\n\n### Medium Household Solutions (500-2000L)\n- Plastic water tanks\n- Concrete storage tanks\n- Elevated storage systems\n\n### Large Household Solutions (3000L+)\n- Underground storage tanks\n- Multiple tank systems\n- Community shared storage\n\n## Key Considerations\n\nWhen selecting water storage solutions, consider:\n- Household size and daily water consumption\n- Available space and installation requirements\n- Budget and long-term maintenance costs\n- Water quality preservation needs\n- Local climate conditions\n\n## Maintenance Best Practices\n\nRegular cleaning and maintenance ensure stored water remains safe for consumption. Clean tanks monthly, inspect for cracks or damage, and ensure proper covering to prevent contamination.\n\nInvesting in appropriate water storage is an investment in your family's health and resilience. Start with your current needs and expand your system over time as resources allow.",
    category_id: "home-solutions",
    image_url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800",
    author_name: "Sarah Wanjiku",
    author_email: "sarah@waterexperts.co.ke",
    tags: "water storage, rural households, tanks, containers, water security",
    featured: true,
    published: true,
    published_at: 1.week.ago,
    read_time: 8,
    views_count: 245,
    likes_count: 18,
    comments_count: 5
  },
  {
    title: "Maximizing Crop Yields with Efficient Irrigation Techniques",
    excerpt: "Learn how modern irrigation methods can increase your harvest while conserving precious water resources. Practical tips for small-scale farmers.",
    content: "Efficient irrigation is the cornerstone of successful farming, especially in regions with variable rainfall. This guide explores proven irrigation techniques that maximize crop yields while minimizing water waste.\n\n## Understanding Your Crops' Water Needs\n\nDifferent crops have varying water requirements throughout their growth cycles. Understanding these needs helps optimize irrigation timing and quantity:\n\n- **Leafy vegetables**: High water needs, frequent irrigation\n- **Root vegetables**: Deep, less frequent watering\n- **Fruit trees**: Seasonal variation in water requirements\n- **Cereals**: Critical periods during flowering and grain filling\n\n## Efficient Irrigation Methods\n\n### Drip Irrigation\nThe most water-efficient method, delivering water directly to plant roots:\n- Reduces water waste by up to 50%\n- Minimizes weed growth\n- Suitable for row crops and orchards\n- Initial investment pays off through water savings\n\n### Sprinkler Systems\nGood for larger areas and crops that benefit from overhead watering:\n- Even water distribution\n- Can be automated with timers\n- Suitable for field crops and pastures\n\n### Furrow Irrigation\nTraditional method suitable for sloped fields:\n- Low initial cost\n- Good for crops planted in rows\n- Requires proper field preparation\n\n## Water Conservation Strategies\n\n1. **Mulching**: Reduces evaporation and maintains soil moisture\n2. **Soil improvement**: Better soil structure retains more water\n3. **Timing**: Irrigate early morning or evening to reduce evaporation\n4. **Monitoring**: Use soil moisture sensors to avoid over-watering\n\n## Economic Benefits\n\nEfficient irrigation systems typically show:\n- 20-40% increase in crop yields\n- 30-50% reduction in water usage\n- Reduced labor costs through automation\n- Better crop quality and market prices\n\n## Getting Started\n\nStart small with a demonstration plot to test different methods. Gradually expand successful techniques to larger areas. Consider forming farmer groups to share costs and knowledge.\n\nRemember, the best irrigation system is one that fits your specific crops, climate, and budget while conserving this precious resource for future generations.",
    category_id: "irrigation-farming",
    image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800",
    author_name: "John Kamau",
    author_email: "john@farmingexperts.co.ke",
    tags: "irrigation, farming, drip irrigation, water conservation, crop yields",
    featured: true,
    published: true,
    published_at: 5.days.ago,
    read_time: 12,
    views_count: 189,
    likes_count: 24,
    comments_count: 8
  },
  {
    title: "Water Quality Testing: Ensuring Safe Drinking Water at Home",
    excerpt: "Simple methods to test and improve your household water quality. Protect your family's health with regular water testing and treatment.",
    content: "Clean, safe drinking water is fundamental to good health, yet many households lack access to reliable water quality information. This guide provides practical steps for testing and improving your home water quality.\n\n## Why Test Your Water?\n\nRegular water testing helps identify:\n- Bacterial contamination\n- Chemical pollutants\n- pH imbalances\n- Heavy metal presence\n- Turbidity and clarity issues\n\nEven water that looks and tastes clean may contain harmful contaminants invisible to the naked eye.\n\n## Basic Water Quality Tests\n\n### Visual Inspection\nStart with simple observations:\n- **Color**: Should be clear and colorless\n- **Odor**: Should have no unusual smells\n- **Taste**: Should taste clean and fresh\n- **Clarity**: Should be free from particles\n\n### Simple Test Kits\nAffordable home testing kits can check:\n- **pH levels**: Ideal range 6.5-8.5\n- **Chlorine**: Indicates treatment levels\n- **Hardness**: Affects soap effectiveness\n- **Bacteria**: Critical for health safety\n\n### Professional Testing\nFor comprehensive analysis, consider laboratory testing for:\n- Heavy metals (lead, mercury, arsenic)\n- Pesticides and chemicals\n- Bacterial contamination\n- Mineral content\n\n## Common Water Problems and Solutions\n\n### High Turbidity\n**Problem**: Cloudy or muddy water\n**Solutions**: \n- Sedimentation tanks\n- Sand filtration\n- Cloth filtration\n\n### Bacterial Contamination\n**Problem**: Harmful bacteria and pathogens\n**Solutions**:\n- Boiling water for 5+ minutes\n- UV sterilization\n- Chlorine treatment\n- Water purification tablets\n\n### Chemical Contamination\n**Problem**: Pesticides, heavy metals, industrial chemicals\n**Solutions**:\n- Activated carbon filters\n- Reverse osmosis systems\n- Ion exchange systems\n\n### pH Imbalance\n**Problem**: Water too acidic or alkaline\n**Solutions**:\n- pH adjustment chemicals\n- Neutralizing filters\n- Blending with different water sources\n\n## Water Treatment Methods\n\n### Household-Level Treatment\n1. **Boiling**: Most effective against pathogens\n2. **Solar disinfection**: Using clear bottles and sunlight\n3. **Ceramic filters**: Remove bacteria and particles\n4. **Biosand filters**: Biological water treatment\n\n### Point-of-Use Systems\n- Countertop filters\n- Under-sink systems\n- Pitcher filters\n- Faucet-mounted filters\n\n## Maintenance and Monitoring\n\n- Test water quality monthly\n- Replace filters according to manufacturer guidelines\n- Clean storage containers regularly\n- Monitor system performance\n- Keep treatment records\n\n## When to Seek Help\n\nContact water quality professionals if you notice:\n- Persistent taste or odor problems\n- Recurring illness in household members\n- Staining of fixtures or clothing\n- Test results outside safe ranges\n\n## Building Water Quality Awareness\n\nShare knowledge with neighbors and community members. Consider forming water quality monitoring groups to share costs and expertise.\n\nRemember, investing in water quality testing and treatment is investing in your family's long-term health and well-being.",
    category_id: "water-health",
    image_url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    author_name: "Dr. Mary Njeri",
    author_email: "mary@healthwater.co.ke",
    tags: "water quality, testing, health, safety, treatment, filtration",
    featured: false,
    published: true,
    published_at: 3.days.ago,
    read_time: 10,
    views_count: 156,
    likes_count: 12,
    comments_count: 3
  },
  {
    title: "Sustainable Livestock Water Management Systems",
    excerpt: "Efficient water systems for livestock that reduce waste, improve animal health, and support sustainable farming practices.",
    content: "Proper water management for livestock is essential for animal health, farm productivity, and environmental sustainability. This comprehensive guide explores modern approaches to livestock water systems.\n\n## Water Requirements by Animal Type\n\nUnderstanding daily water needs helps design appropriate systems:\n\n### Cattle\n- **Dairy cows**: 100-200L per day\n- **Beef cattle**: 30-50L per day\n- **Calves**: 10-20L per day\n\n### Small Ruminants\n- **Goats**: 3-8L per day\n- **Sheep**: 2-6L per day\n\n### Poultry\n- **Chickens**: 0.2-0.5L per day\n- **Ducks**: 0.5-1L per day\n\n### Pigs\n- **Adult pigs**: 15-25L per day\n- **Piglets**: 2-5L per day\n\n## System Design Principles\n\n### Accessibility\n- Water sources within 200m of grazing areas\n- Multiple access points for large herds\n- Appropriate height for different animals\n- Non-slip surfaces around water points\n\n### Water Quality\n- Regular testing for contaminants\n- Protection from surface runoff\n- Adequate flow rates to prevent stagnation\n- Easy cleaning and maintenance access\n\n### Reliability\n- Backup water sources\n- Gravity-fed systems where possible\n- Solar-powered pumping systems\n- Emergency water storage\n\n## Modern Water System Options\n\n### Automatic Waterers\n**Benefits**:\n- Constant fresh water supply\n- Reduced labor requirements\n- Minimized water waste\n- Better hygiene\n\n**Types**:\n- Float valve systems\n- Pressure-activated bowls\n- Nipple drinkers for poultry\n- Bite-ball valves\n\n### Solar-Powered Systems\n**Advantages**:\n- Environmentally friendly\n- Low operating costs\n- Suitable for remote locations\n- Reliable in sunny climates\n\n**Components**:\n- Solar panels\n- Water pumps\n- Storage tanks\n- Distribution systems\n\n### Gravity-Fed Systems\n**Benefits**:\n- No electricity required\n- Low maintenance\n- Reliable operation\n- Cost-effective\n\n**Requirements**:\n- Elevated water source\n- Proper pipe sizing\n- Pressure regulation\n- Overflow management\n\n## Water Conservation Strategies\n\n### Leak Prevention\n- Regular system inspections\n- Quality pipe materials\n- Proper installation techniques\n- Prompt repair protocols\n\n### Efficient Distribution\n- Appropriate pipe sizing\n- Pressure regulation\n- Strategic placement of water points\n- Minimized pipe runs\n\n### Recycling and Reuse\n- Greywater systems for non-drinking uses\n- Rainwater harvesting\n- Runoff collection and treatment\n- Integrated aquaculture systems\n\n## Health and Safety Considerations\n\n### Water Quality Monitoring\n- Regular bacterial testing\n- Chemical analysis\n- pH monitoring\n- Temperature checks\n\n### System Hygiene\n- Regular cleaning schedules\n- Biofilm prevention\n- Algae control\n- Contamination prevention\n\n### Animal Health Benefits\n- Improved milk production\n- Better feed conversion\n- Reduced disease incidence\n- Enhanced reproductive performance\n\n## Economic Analysis\n\n### Initial Investment\n- System design and installation\n- Equipment and materials\n- Labor costs\n- Permits and approvals\n\n### Operating Costs\n- Energy consumption\n- Maintenance and repairs\n- Water costs\n- Labor requirements\n\n### Return on Investment\n- Increased productivity\n- Reduced labor costs\n- Lower veterinary expenses\n- Improved animal welfare\n\n## Implementation Steps\n\n1. **Assessment**: Evaluate current water needs and systems\n2. **Planning**: Design appropriate system for your operation\n3. **Installation**: Professional installation or DIY approach\n4. **Testing**: Verify system performance and water quality\n5. **Training**: Educate staff on system operation and maintenance\n6. **Monitoring**: Regular performance and quality checks\n\n## Troubleshooting Common Issues\n\n### Low Water Pressure\n- Check for leaks\n- Verify pump operation\n- Clean filters and screens\n- Assess pipe sizing\n\n### Water Quality Problems\n- Test for contamination sources\n- Increase cleaning frequency\n- Check storage tank conditions\n- Review system design\n\n### System Failures\n- Maintain spare parts inventory\n- Develop emergency protocols\n- Train multiple staff members\n- Consider backup systems\n\n## Future Considerations\n\nAs your operation grows, plan for:\n- Expandable system design\n- Technology upgrades\n- Changing regulations\n- Climate adaptation\n\nInvesting in proper livestock water management pays dividends in animal health, productivity, and environmental stewardship. Start with your most critical needs and expand the system over time.",
    category_id: "livestock-aquaculture",
    image_url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800",
    author_name: "Peter Mwangi",
    author_email: "peter@livestockwater.co.ke",
    tags: "livestock, water management, cattle, goats, automatic waterers, solar pumps",
    featured: false,
    published: true,
    published_at: 1.day.ago,
    read_time: 15,
    views_count: 98,
    likes_count: 7,
    comments_count: 2
  }
]

blog_posts.each do |post_data|
  post = BlogPost.create!(
    post_data.merge(
      created_by: admin_user,
      updated_by: admin_user
    )
  )
  puts "  ✅ Created blog post: #{post.title}"
end

puts ""
puts "🎉 Content seeding completed successfully!"
puts ""
puts "📊 Summary:"
puts "  Gallery Items: #{GalleryItem.count}"
puts "  Marketplace Items: #{MarketplaceItem.count}"
puts "  Blog Posts: #{BlogPost.count}"
puts ""
puts "🔑 Admin Login Credentials:"
puts "  Email: admin@village-water-system.com"
puts "  Phone: +254700000000"
puts "  Password: AdminPassword123!"
puts ""
puts "🚀 You can now:"
puts "  1. Login as admin to manage content"
puts "  2. View content on the public pages"
puts "  3. Test the API endpoints"
puts ""