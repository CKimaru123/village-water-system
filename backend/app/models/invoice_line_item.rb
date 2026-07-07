class InvoiceLineItem < ApplicationRecord
  belongs_to :invoice

  # Enums for controlled values
  enum :item_type, { 
    water_consumption: 'water_consumption', 
    fixed_charge: 'fixed_charge', 
    sewerage: 'sewerage', 
    late_fee: 'late_fee', 
    adjustment: 'adjustment' 
  }

  validates :item_type, presence: true
  validates :description, presence: true
  validates :amount, presence: true, numericality: true
  validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
  validates :unit_rate, numericality: { greater_than: 0 }, allow_nil: true

  def formatted_amount
    "KES #{amount.to_f.round(2)}"
  end

  def formatted_unit_rate
    return nil unless unit_rate
    "KES #{unit_rate.to_f.round(2)}"
  end
end