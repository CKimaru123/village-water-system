class KnowledgeBaseArticle < ApplicationRecord
  belongs_to :created_by, class_name: 'User', foreign_key: 'created_by_id', optional: true

  validates :title, presence: true
  validates :content, presence: true
  validates :category, presence: true, inclusion: {
    in: %w[general faq water_quality billing connection maintenance safety],
    message: "%{value} is not a valid category"
  }

  scope :published, -> { where(published: true) }
  scope :by_category, ->(cat) { where(category: cat) }
  scope :recent, -> { order(created_at: :desc) }
  scope :search, ->(q) {
    where("LOWER(title) LIKE :q OR LOWER(content) LIKE :q OR LOWER(tags) LIKE :q",
          q: "%#{q.downcase}%")
  }

  before_create -> { self.views_count ||= 0 }

  def increment_views!
    increment!(:views_count)
  end
end
