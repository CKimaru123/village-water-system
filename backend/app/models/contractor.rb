class Contractor < ApplicationRecord
  belongs_to :created_by, class_name: 'User', optional: true

  validates :name, presence: true

  scope :active, -> { where(status: 'active') }
  scope :recent, -> { order(created_at: :desc) }
end
