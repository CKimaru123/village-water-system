class Deposit < ApplicationRecord
  belongs_to :user
  belongs_to :connection,   optional: true
  belongs_to :recorded_by,  class_name: 'User', optional: true

  validates :deposit_type, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }

  scope :pending,   -> { where(status: 'pending') }
  scope :confirmed, -> { where(status: 'confirmed') }
  scope :recent,    -> { order(created_at: :desc) }
end
