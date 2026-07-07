class AddSellerUserToMarketplaceItems < ActiveRecord::Migration[8.1]
  def change
    add_reference :marketplace_items, :seller_user, null: true, foreign_key: { to_table: :users }
  end
end
