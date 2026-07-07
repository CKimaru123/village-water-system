class RemoveUnusedTimestampColumns < ActiveRecord::Migration[8.1]
  def change
    remove_column :users, :last_login_at, :datetime
    remove_column :users, :password_changed_at, :datetime
  end
end
