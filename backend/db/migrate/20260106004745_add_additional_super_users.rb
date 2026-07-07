class AddAdditionalSuperUsers < ActiveRecord::Migration[8.1]
  def up
    # Add additional super users
    User.create!(
      phone: '+254712345679',
      email: 'newsuperadmin@village-water-system.com',
      password: 'NewSuperAdmin123!',
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

    puts "Additional super user created successfully!"
  end

  def down
    # Remove the super user if rolling back
    User.find_by(email: 'newsuperadmin@village-water-system.com')&.destroy
  end
end
