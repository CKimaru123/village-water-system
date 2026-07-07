class CreateMarketplaceItems < ActiveRecord::Migration[8.1]
  def change
    create_table :marketplace_items do |t|
      t.string :title, null: false
      t.text :description, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :category, null: false
      t.string :seller_name, null: false
      t.string :seller_phone, null: false
      t.string :seller_email, null: false
      t.string :location, null: false
      t.text :images, null: false # JSON array of image URLs
      t.decimal :rating, precision: 3, scale: 2, default: 0.0
      t.integer :reviews_count, default: 0
      t.boolean :featured, default: false
      t.boolean :in_stock, default: true
      t.boolean :active, default: true
      t.text :specifications # JSON object
      t.text :tags
      t.integer :views_count, default: 0
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :updated_by, null: true, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :marketplace_items, :category
    add_index :marketplace_items, :featured
    add_index :marketplace_items, :active
    add_index :marketplace_items, :in_stock
    add_index :marketplace_items, :price
    add_index :marketplace_items, :rating
    add_index :marketplace_items, :created_at
    add_index :marketplace_items, :seller_name
    add_index :marketplace_items, :location
  end
end