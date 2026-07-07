class TreeGrowthUpdate < ApplicationRecord
  belongs_to :tree_planting
  belongs_to :user

  HEALTH_STATUSES = %w[healthy stressed dead unknown].freeze

  validates :update_date,   presence: true
  validates :health_status, inclusion: { in: HEALTH_STATUSES }, allow_nil: true
  validates :trees_alive,   numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
end
