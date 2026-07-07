class Subsidy < ApplicationRecord
  belongs_to :user
  belongs_to :invoice,     optional: true
  belongs_to :approved_by, class_name: 'User', optional: true

  SUBSIDY_TYPES = %w[fixed_amount percentage].freeze

  validates :subsidy_type, presence: true, inclusion: { in: SUBSIDY_TYPES }
  validates :reason, presence: true, length: { minimum: 5 }
  validates :amount,
            numericality: { greater_than: 0 },
            if: -> { subsidy_type == 'fixed_amount' }
  validates :percentage_discount,
            presence: true,
            numericality: { greater_than: 0, less_than_or_equal_to: 100 },
            if: -> { subsidy_type == 'percentage' }

  scope :pending,  -> { where(status: 'pending') }
  scope :approved, -> { where(status: 'approved') }
  scope :active,   -> { where(status: 'approved').where('valid_until IS NULL OR valid_until >= ?', Date.current) }
  scope :recent,   -> { order(created_at: :desc) }

  # Calculate the actual discount amount given a pre-subsidy total
  def discount_amount(pre_subsidy_total)
    if subsidy_type == 'percentage'
      (pre_subsidy_total * (percentage_discount / 100.0)).round(2)
    else
      [amount.to_f, pre_subsidy_total].min
    end
  end

  def approve!(admin, notes = nil)
    transaction do
      update!(status: 'approved', approved_by: admin, approved_at: Time.current, notes: notes)
      # Reduce the linked invoice total by the subsidy amount
      if invoice && amount.present? && amount > 0
        new_total = [invoice.total_amount - amount, 0].max
        invoice.update!(total_amount: new_total)
      end
    end
  end
end
