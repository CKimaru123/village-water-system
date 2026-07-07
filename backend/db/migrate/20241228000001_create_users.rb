class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      # Account type and role
      t.string :account_type, null: false, default: 'household'
      t.string :role, null: false, default: 'client'
      t.string :status, null: false, default: 'active'
      
      # Authentication
      t.string :phone, null: false
      t.string :email
      t.string :password_digest, null: false
      
      # Communication preferences
      t.string :communication_preference, null: false
      t.text :landmark
      t.boolean :newsletter_subscription, default: false
      
      # Household-specific fields
      t.string :first_name
      t.string :last_name
      t.string :alt_phone
      t.string :plot_number
      t.integer :household_size
      t.string :village
      
      # Institution-specific fields
      t.string :institution_name
      t.string :institution_type
      t.string :contact_person
      t.string :alt_contact
      t.integer :population_served
      t.string :storage_capacity

      t.timestamps
    end

    # Add indexes for performance and uniqueness
    add_index :users, :phone, unique: true
    add_index :users, :email, unique: true, where: "email IS NOT NULL"
    add_index :users, :account_type
    add_index :users, :role
    add_index :users, :status
  end
end