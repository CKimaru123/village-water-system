class ScadaReading < ApplicationRecord
  belongs_to :connection, optional: true

  validates :sensor_type,  presence: true
  validates :value,        presence: true
  validates :recorded_at,  presence: true

  scope :recent,      -> { order(recorded_at: :desc) }
  scope :by_sensor,   ->(type) { where(sensor_type: type) }
  scope :anomalous,   -> { where(status: 'anomaly') }
  scope :in_period,   ->(from, to) { where(recorded_at: from..to) }
end
