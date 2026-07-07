class Meter < ApplicationRecord
  belongs_to :connection

  # Enums for controlled values
  enum :meter_type, { mechanical: 'mechanical', digital: 'digital', smart: 'smart' }
  enum :meter_status, { active: 'active', faulty: 'faulty', replaced: 'replaced' }

  validates :meter_serial, presence: true, uniqueness: true
  validates :meter_type, presence: true
  validates :installation_date, presence: true
  validates :meter_status, presence: true
  validates :last_reading_value, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # Generate meter serial before validation
  before_validation :generate_meter_serial, on: :create

  scope :active, -> { where(meter_status: 'active') }
  scope :needs_calibration, -> { where('next_calibration_date <= ?', Date.current) }

  def user
    connection.user
  end

  def current_reading
    last_reading_value || 0
  end

  def days_since_last_reading
    return nil unless last_reading_date
    (Date.current - last_reading_date).to_i
  end

  def calibration_due?
    next_calibration_date && next_calibration_date <= Date.current
  end

  private

  def generate_meter_serial
    return if meter_serial.present?
    
    # Generate meter serial: SER + year + sequence
    year = Date.current.year.to_s[-2..-1]
    sequence = Meter.where("meter_serial LIKE ?", "SER#{year}%").count + 1
    self.meter_serial = "SER#{year}#{sequence.to_s.rjust(4, '0')}"
  end
end