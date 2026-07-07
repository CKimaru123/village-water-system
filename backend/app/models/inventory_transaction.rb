class InventoryTransaction < ApplicationRecord
  belongs_to :inventory_item
  belongs_to :recorded_by, class_name: 'User', optional: true

  validates :transaction_type, presence: true
  validates :quantity, presence: true, numericality: { other_than: 0 }

  after_create :update_stock

  scope :recent, -> { order(created_at: :desc) }

  private

  def update_stock
    if transaction_type == 'in'
      inventory_item.increment!(:quantity_in_stock, quantity.abs)
    elsif transaction_type == 'out'
      inventory_item.decrement!(:quantity_in_stock, quantity.abs)
    end
  end
end
