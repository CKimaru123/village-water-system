class CreateAnnouncements < ActiveRecord::Migration[8.1]
  def change
    create_table :announcements do |t|
      t.string :title
      t.text :content
      t.string :category
      t.string :priority
      t.boolean :published
      t.datetime :published_at
      t.datetime :expires_at
      t.integer :created_by_id
      t.string :target_audience

      t.timestamps
    end
  end
end
