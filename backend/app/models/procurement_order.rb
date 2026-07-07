class ProcurementOrder < ApplicationRecord
  belongs_to :approved_by, class_name: 'User', optional: true
  belongs_to :created_by,  class_name: 'User', optional: true

  validates :supplier_name, presence: true

  before_validation :generate_order_number, on: :create

  scope :pending,  -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :recent,   -> { order(created_at: :desc) }

  def approve!(admin)
    update!(status: 'approved', approved_by: admin, approved_at: Time.current)
  end

  private

  def generate_order_number
    self.order_number ||= "PO-#{Date.current.year}-#{SecureRandom.hex(4).upcase}"
  end
end
