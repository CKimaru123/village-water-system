class InventoryItem < ApplicationRecord
  belongs_to :created_by, class_name: 'User', optional: true
  has_many :inventory_transactions, dependent: :destroy

  validates :item_name, presence: true
  validates :quantity_in_stock, numericality: { greater_than_or_equal_to: 0 }

  scope :low_stock,    -> { where('quantity_in_stock <= reorder_level AND reorder_level > 0') }
  scope :by_category,  ->(cat) { where(category: cat) }
  scope :recent,       -> { order(created_at: :desc) }

  def low_stock?
    reorder_level > 0 && quantity_in_stock <= reorder_level
  end
end
