class PaymentPlan < ApplicationRecord
  belongs_to :user
  belongs_to :invoice
  belongs_to :approved_by, class_name: 'User', optional: true

  validates :total_amount,       presence: true, numericality: { greater_than: 0 }
  validates :installment_amount, presence: true, numericality: { greater_than: 0 }
  validates :installments_count, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: %w[pending active completed defaulted cancelled] }

  scope :active,   -> { where(status: 'active') }
  scope :pending,  -> { where(status: 'pending') }
  scope :recent,   -> { order(created_at: :desc) }

  def remaining_installments
    installments_count - installments_paid
  end

  def remaining_amount
    total_amount - (installment_amount * installments_paid)
  end

  def approve!(admin)
    update!(status: 'active', approved_by: admin, approved_at: Time.current,
            next_due_date: Date.current + 30.days)
  end

  def record_installment_payment!
    increment!(:installments_paid)
    if installments_paid >= installments_count
      update!(status: 'completed', next_due_date: nil)
    else
      update!(next_due_date: next_due_date + 30.days)
    end
  end
end
