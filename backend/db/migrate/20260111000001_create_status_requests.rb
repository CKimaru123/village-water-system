class CreateStatusRequests < ActiveRecord::Migration[7.0]
  def change
    create_table :status_requests do |t|
      t.references :user, null: false, foreign_key: true
      t.references :requested_by, null: false, foreign_key: { to_table: :users }
      t.string :request_type, null: false # 'pause', 'reactivate', 'appeal'
      t.string :from_status, null: false
      t.string :to_status, null: false
      t.text :reason
      t.date :start_date
      t.date :end_date
      t.string :status, default: 'pending' # 'pending', 'approved', 'denied', 'completed'
      t.text :admin_notes
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.datetime :reviewed_at
      t.text :supporting_documents # JSON field for file paths/URLs
      
      t.timestamps
    end

    add_index :status_requests, [:user_id, :status]
    add_index :status_requests, [:status, :created_at]
    add_index :status_requests, :request_type
  end
end