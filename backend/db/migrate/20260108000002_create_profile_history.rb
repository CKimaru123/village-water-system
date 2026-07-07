class CreateProfileHistory < ActiveRecord::Migration[8.1]
  def change
    create_table :profile_history do |t|
      t.references :user, null: false, foreign_key: true
      t.string :field_name, null: false
      t.text :old_value
      t.text :new_value
      t.references :changed_by, null: true, foreign_key: { to_table: :users }
      t.timestamp :changed_at, default: -> { 'CURRENT_TIMESTAMP' }
      
      t.timestamps
    end

    add_index :profile_history, :changed_at
    add_index :profile_history, :field_name
  end
end