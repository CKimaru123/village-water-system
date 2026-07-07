class AddExcerptToKnowledgeBaseArticles < ActiveRecord::Migration[8.1]
  def change
    add_column :knowledge_base_articles, :excerpt, :text
    change_column_default :knowledge_base_articles, :published, from: nil, to: false
    change_column_default :knowledge_base_articles, :views_count, from: nil, to: 0
  end
end
