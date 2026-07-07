require_relative 'config/environment'

admin = User.where(role: ['admin', 'super_admin']).first

unless admin
  puts "No admin user found. Skipping."
  exit
end

if Poll.count > 0
  puts "Polls already exist (#{Poll.count}). Skipping."
  exit
end

polls_data = [
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
  }
]

polls_data.each do |data|
  options = data.delete(:options)
  poll = Poll.create!(data.merge(created_by: admin))
  options.each { |opt| poll.poll_options.create!(option_text: opt) }
  puts "Created poll: #{poll.title}"
end

puts "Done. #{Poll.count} polls in database."
