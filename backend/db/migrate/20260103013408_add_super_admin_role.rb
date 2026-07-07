class AddSuperAdminRole < ActiveRecord::Migration[8.1]
  def up
    # Add super_admin role to existing enum
    # Since we're using string enums, we just need to create a super admin user
    # The enum is already updated in the model
    
    # Create the first super admin user
    User.create!(
      phone: '+254712345678',
      email: 'superadmin@village-water-system.com',
      password: 'SuperAdmin123!',
      password_confirmation: 'SuperAdmin123!',
      first_name: 'Super',
      last_name: 'Administrator',
      account_type: 'household',
      role: 'super_admin',
      status: 'active',
      communication_preference: 'email',
      alt_phone: '+254712345679',
      plot_number: 'ADMIN-001',
      household_size: 1,
      village: 'System'
    )
    
    puts "Super Admin created successfully!"
    puts "Email: superadmin@village-water-system.com"
    puts "Password: SuperAdmin123!"
  end

  def down
    # Remove super admin users
    User.where(role: 'super_admin').destroy_all
  end
end
