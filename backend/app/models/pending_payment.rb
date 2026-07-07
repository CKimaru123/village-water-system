class PendingPayment < ApplicationRecord
  belongs_to :user
  belongs_to :invoice, optional: true
  belongs_to :initiated_by, class_name: "User", foreign_key: :initiated_by_id, optional: true

  enum :status, { pending: "pending", completed: "completed", failed: "failed", expired: "expired" }
  enum :payment_method, { mpesa: "mpesa", airtel_money: "airtel_money", bank_card: "bank_card" }

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :checkout_request_id, uniqueness: true, allow_nil: true

  # Expire pending payments older than 5 minutes (STK push timeout)
  scope :stale, -> { where(status: "pending").where("created_at < ?", 5.minutes.ago) }
end
