class CreateBlogPosts < ActiveRecord::Migration[8.1]
  def change
    create_table :blog_posts do |t|
      t.string :title, null: false
      t.text :excerpt, null: false
      t.text :content, null: false
      t.string :category_id, null: false
      t.string :image_url, null: false
      t.string :author_name, null: false
      t.string :author_email
      t.text :tags
      t.boolean :featured, default: false
      t.boolean :published, default: false
      t.datetime :published_at
      t.integer :read_time, default: 5 # minutes
      t.integer :views_count, default: 0
      t.integer :likes_count, default: 0
      t.integer :comments_count, default: 0
      t.text :meta_description
      t.string :slug, null: false
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :updated_by, null: true, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :blog_posts, :category_id
    add_index :blog_posts, :featured
    add_index :blog_posts, :published
    add_index :blog_posts, :published_at
    add_index :blog_posts, :slug, unique: true
    add_index :blog_posts, :created_at
    add_index :blog_posts, :views_count
    add_index :blog_posts, :likes_count
  end
end