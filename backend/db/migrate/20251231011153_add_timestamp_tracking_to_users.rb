class AddTimestampTrackingToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :last_login_at, :datetime
    add_column :users, :password_changed_at, :datetime
  end
end
