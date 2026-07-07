class CreateUserProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :user_profiles do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :account_number
      t.text :additional_notes
      t.text :emergency_contact_info
      t.json :preferences # For storing flexible user preferences
      t.json :metadata # For storing additional flexible data
      
      t.timestamps
    end

    add_index :user_profiles, :account_number, unique: true
  end
end