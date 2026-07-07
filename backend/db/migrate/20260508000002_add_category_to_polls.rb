class AddCategoryToPolls < ActiveRecord::Migration[8.1]
  def change
    add_column :polls, :category, :string unless column_exists?(:polls, :category)
  end
end
