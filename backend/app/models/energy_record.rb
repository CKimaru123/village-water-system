class EnergyRecord < ApplicationRecord
  belongs_to :asset,       optional: true
  belongs_to :recorded_by, class_name: 'User', optional: true

  validates :energy_type,  presence: true
  validates :quantity,     presence: true, numericality: { greater_than: 0 }
  validates :record_date,  presence: true

  scope :recent,      -> { order(record_date: :desc) }
  scope :by_type,     ->(type) { where(energy_type: type) }
  scope :in_period,   ->(from, to) { where(record_date: from..to) }
end
