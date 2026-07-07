class CreateStatusHistory < ActiveRecord::Migration[7.0]
  def change
    create_table :status_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.references :changed_by, null: false, foreign_key: { to_table: :users }
      t.string :from_status, null: false
      t.string :to_status, null: false
      t.text :reason
      t.string :change_type, null: false # 'admin_action', 'user_request', 'system_auto', 'super_admin_override'
      t.references :related_request, foreign_key: { to_table: :status_requests }
      t.json :metadata # Additional context data
      
      t.timestamps
    end

    add_index :status_histories, [:user_id, :created_at]
    add_index :status_histories, :change_type
    add_index :status_histories, :created_at
  end
end