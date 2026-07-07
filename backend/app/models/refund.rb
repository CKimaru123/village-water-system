class Refund < ApplicationRecord
  belongs_to :user
  belongs_to :payment,     optional: true
  belongs_to :reviewed_by, class_name: 'User', optional: true

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :reason, presence: true

  scope :pending,  -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :recent,   -> { order(created_at: :desc) }

  def approve!(admin, notes = nil)
    transaction do
      update!(status: 'approved', reviewed_by: admin, reviewed_at: Time.current, admin_notes: notes,
              reference_number: "REF-#{Time.current.to_i}-#{SecureRandom.hex(3).upcase}")
      # Create a negative payment record for audit trail
      Payment.create!(
        user: user,
        invoice: payment&.invoice,
        amount: amount,
        payment_method: refund_method || 'cash',
        transaction_reference: reference_number,
        status: 'refunded',
        payment_date: Time.current,
        notes: "Refund: #{reason}"
      )
    end
  end

  def reject!(admin, notes)
    update!(status: 'rejected', reviewed_by: admin, reviewed_at: Time.current, admin_notes: notes)
  end
end
