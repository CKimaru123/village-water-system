class CreateAppeals < ActiveRecord::Migration[7.0]
  def change
    create_table :appeals do |t|
      t.references :user, null: false, foreign_key: true
      t.references :original_action, foreign_key: { to_table: :status_histories }
      t.text :reason, null: false
      t.text :supporting_documents # JSON field for file paths/URLs
      t.string :status, default: 'pending' # 'pending', 'under_review', 'approved', 'denied'
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.text :resolution
      t.datetime :reviewed_at
      t.string :priority, default: 'normal' # 'low', 'normal', 'high', 'urgent'
      
      t.timestamps
    end

    add_index :appeals, [:user_id, :status]
    add_index :appeals, [:status, :created_at]
    add_index :appeals, :priority
  end
end