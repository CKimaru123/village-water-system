class MeterReading < ApplicationRecord
  belongs_to :connection
  belongs_to :recorded_by, class_name: 'User', optional: true

  # Enums
  enum :reading_type, { manual: 'manual', automatic: 'automatic' }

  # Validations
  validates :reading_value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :reading_date, presence: true
  validates :reading_type, presence: true
  validate :reading_not_less_than_previous
  validate :reading_date_not_in_future

  # Scopes
  scope :for_connection, ->(connection_id) { where(connection_id: connection_id) }
  scope :in_date_range, ->(start_date, end_date) { where(reading_date: start_date..end_date) }
  scope :manual_readings, -> { where(reading_type: 'manual') }
  scope :automatic_readings, -> { where(reading_type: 'automatic') }
  scope :recent, -> { order(reading_date: :desc) }

  # Instance methods
  def consumption
    previous_reading = connection.meter_readings
                                 .where('reading_date < ?', reading_date)
                                 .order(reading_date: :desc)
                                 .first
    
    return 0 unless previous_reading
    reading_value - previous_reading.reading_value
  end

  def days_since_last_reading
    previous_reading = connection.meter_readings
                                 .where('reading_date < ?', reading_date)
                                 .order(reading_date: :desc)
                                 .first
    
    return nil unless previous_reading
    (reading_date - previous_reading.reading_date).to_i
  end

  def average_daily_consumption
    days = days_since_last_reading
    return 0 unless days && days > 0
    (consumption.to_f / days).round(2)
  end

  private

  def reading_not_less_than_previous
    previous_reading = connection.meter_readings
                                 .where('reading_date < ?', reading_date)
                                 .order(reading_date: :desc)
                                 .first
    
    if previous_reading && reading_value < previous_reading.reading_value
      errors.add(:reading_value, "cannot be less than previous reading (#{previous_reading.reading_value})")
    end
  end

  def reading_date_not_in_future
    if reading_date.present? && reading_date > Date.current
      errors.add(:reading_date, "cannot be in the future")
    end
  end
end
