class CreateGalleryItems < ActiveRecord::Migration[8.1]
  def change
    create_table :gallery_items do |t|
      t.string :title, null: false
      t.text :description
      t.string :large_image_url, null: false
      t.string :small_image_url, null: false
      t.string :category
      t.text :tags
      t.boolean :featured, default: false
      t.boolean :active, default: true
      t.integer :sort_order, default: 0
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :updated_by, null: true, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :gallery_items, :category
    add_index :gallery_items, :featured
    add_index :gallery_items, :active
    add_index :gallery_items, :sort_order
    add_index :gallery_items, :created_at
  end
end