class CreateNotifications < ActiveRecord::Migration[7.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :message, null: false
      t.string :notification_type, null: false
      t.json :metadata, default: {}
      t.boolean :read, default: false
      t.datetime :read_at
      t.string :priority, default: 'normal' # low, normal, high, urgent
      t.string :category, default: 'general' # profile, billing, service, system, etc.
      t.references :related_user, null: true, foreign_key: { to_table: :users } # who triggered the notification
      t.string :action_url # optional URL for notification action
      t.datetime :expires_at # optional expiration date

      t.timestamps
    end

    add_index :notifications, [:user_id, :read]
    add_index :notifications, [:user_id, :created_at]
    add_index :notifications, :notification_type
    add_index :notifications, :category
  end
end