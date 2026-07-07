class AnomalyDetection < ApplicationRecord
  belongs_to :connection, optional: true
  belongs_to :user,       optional: true

  validates :anomaly_type,  presence: true
  validates :detected_at,   presence: true

  before_validation :set_detected_at, on: :create

  scope :open,     -> { where(status: 'open') }
  scope :recent,   -> { order(detected_at: :desc) }
  scope :critical, -> { where(severity: 'critical') }
  scope :by_type,  ->(type) { where(anomaly_type: type) }

  private

  def set_detected_at
    self.detected_at ||= Time.current
  end
end
