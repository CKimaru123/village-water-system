class CreateKnowledgeBaseArticles < ActiveRecord::Migration[8.1]
  def change
    create_table :knowledge_base_articles do |t|
      t.string :title
      t.text :content
      t.string :category
      t.text :tags
      t.boolean :published
      t.integer :created_by_id
      t.integer :views_count

      t.timestamps
    end
  end
end
