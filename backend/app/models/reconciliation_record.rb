class ReconciliationRecord < ApplicationRecord
  belongs_to :payment
  belongs_to :invoice,         optional: true
  belongs_to :reconciled_by,   class_name: 'User', optional: true

  validates :payment_id, presence: true

  scope :matched,    -> { where(status: 'matched') }
  scope :unmatched,  -> { where(status: 'unmatched') }
  scope :recent,     -> { order(created_at: :desc) }
end
