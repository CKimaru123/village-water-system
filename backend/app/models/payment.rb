class Payment < ApplicationRecord
  belongs_to :user
  belongs_to :invoice, optional: true

  enum :status, { pending: 'pending', completed: 'completed', failed: 'failed', refunded: 'refunded' }
  enum :payment_method, { mpesa: 'mpesa', bank_transfer: 'bank_transfer', cash: 'cash', cheque: 'cheque' }

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :payment_method, presence: true
  validates :status, presence: true

  before_validation :generate_reference, on: :create

  scope :recent, -> { order(payment_date: :desc) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }

  def self.record_payment(user:, invoice:, amount:, method:, reference: nil)
    payment = create!(
      user: user,
      invoice: invoice,
      amount: amount,
      payment_method: method,
      transaction_reference: reference,
      status: 'completed',
      payment_date: Time.current
    )
    if invoice && amount >= invoice.total_amount
      invoice.mark_as_paid!
      # Mark any open dunning actions for this invoice as resolved
      DunningAction.where(invoice: invoice).update_all(status: 'resolved')
    end
    payment
  end

  private

  def generate_reference
    self.transaction_reference ||= "PAY-#{Time.current.to_i}-#{SecureRandom.hex(4).upcase}"
  end
end
