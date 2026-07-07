class CannedResponse < ApplicationRecord
  belongs_to :created_by, class_name: 'User', optional: true

  validates :title, presence: true
  validates :body,  presence: true

  scope :active,      -> { where(active: true) }
  scope :by_category, ->(cat) { where(category: cat) }
  scope :recent,      -> { order(created_at: :desc) }
end
