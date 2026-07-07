# Code to add another super user
# Run this in Rails console: rails console

# Method 1: Create a new super user directly
super_user = User.create!(
  phone: '+254712345679',  # Change to desired phone number
  email: 'newsuperadmin@village-water-system.com',  # Change to desired email
  password: 'NewSuperAdmin123!',  # Change to desired password
  password_confirmation: 'NewSuperAdmin123!',
  first_name: 'New',
  last_name: 'SuperAdmin',
  account_type: 'household',
  role: 'super_admin',
  status: 'active',
  communication_preference: 'email',
  alt_phone: '+254712345680',
  plot_number: 'SA002',
  household_size: 1,
  village: 'Admin Village'
)

puts "Super user created successfully!"
puts "Email: #{super_user.email}"
puts "Phone: #{super_user.phone}"
puts "Role: #{super_user.role}"

# Method 2: Promote an existing user to super admin
# existing_user = User.find_by(email: 'existing@example.com')
# existing_user.update!(role: 'super_admin')
# puts "User promoted to super admin!"

# Method 3: Create multiple super users at once
# super_users_data = [
#   {
#     phone: '+254712345681',
#     email: 'superadmin2@village-water-system.com',
#     password: 'SuperAdmin2123!',
#     password_confirmation: 'SuperAdmin2123!',
#     first_name: 'Second',
#     last_name: 'SuperAdmin',
#     account_type: 'household',
#     role: 'super_admin',
#     status: 'active',
#     communication_preference: 'email',
#     alt_phone: '+254712345682',
#     plot_number: 'SA003',
#     household_size: 1,
#     village: 'Admin Village'
#   },
#   {
#     phone: '+254712345683',
#     email: 'superadmin3@village-water-system.com',
#     password: 'SuperAdmin3123!',
#     password_confirmation: 'SuperAdmin3123!',
#     first_name: 'Third',
#     last_name: 'SuperAdmin',
#     account_type: 'household',
#     role: 'super_admin',
#     status: 'active',
#     communication_preference: 'email',
#     alt_phone: '+254712345684',
#     plot_number: 'SA004',
#     household_size: 1,
#     village: 'Admin Village'
#   }
# ]

# super_users_data.each do |user_data|
#   User.create!(user_data)
#   puts "Created super user: #{user_data[:email]}"
# end