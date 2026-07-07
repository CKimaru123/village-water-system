class ValveOperation < ApplicationRecord
  belongs_to :operated_by, class_name: 'User', optional: true

  validates :valve_name,     presence: true
  validates :operation_type, presence: true

  scope :open_valves,   -> { where(status: 'open') }
  scope :closed_valves, -> { where(status: 'closed') }
  scope :by_zone,       ->(zone) { where(zone: zone) }
  scope :recent,        -> { order(created_at: :desc) }
end
