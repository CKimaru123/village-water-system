class Connection < ApplicationRecord
  belongs_to :user
  has_one :meter, dependent: :destroy
  has_many :meter_readings, dependent: :destroy

  # Validations
  validates :connection_number, presence: true, uniqueness: true
  validates :meter_number, presence: true, uniqueness: true
  validates :connection_date, presence: true
  validates :connection_type, presence: true, inclusion: { in: %w[domestic commercial institutional] }
  validates :connection_status, presence: true, inclusion: { in: %w[pending active inactive suspended] }
  validates :account_number, uniqueness: true, allow_nil: true

  # Generate connection and meter numbers before validation
  before_validation :generate_connection_number, on: :create
  before_validation :generate_meter_number, on: :create
  before_validation :generate_account_number, on: :create

  scope :active, -> { where(connection_status: 'active') }
  scope :in_zone, ->(zone) { where(zone: zone) }
  scope :by_type, ->(type) { where(connection_type: type) }

  def display_status
    connection_status.humanize
  end

  def location_coordinates
    return nil unless gps_latitude && gps_longitude
    [gps_latitude, gps_longitude]
  end

  def last_meter_reading
    meter_readings.order(reading_date: :desc).first
  end

  def consumption_history(months = 6)
    meter_readings.where('reading_date >= ?', months.months.ago).order(reading_date: :asc)
  end

  private

  def generate_connection_number
    return if connection_number.present?
    
    # Generate connection number: CON + year + sequence
    year = Date.current.year.to_s[-2..-1]
    sequence = Connection.where("connection_number LIKE ?", "CON#{year}%").count + 1
    self.connection_number = "CON#{year}#{sequence.to_s.rjust(4, '0')}"
  end

  def generate_meter_number
    return if meter_number.present?
    
    # Generate meter number: MTR + year + sequence
    year = Date.current.year.to_s[-2..-1]
    sequence = Connection.where("meter_number LIKE ?", "MTR#{year}%").count + 1
    self.meter_number = "MTR#{year}#{sequence.to_s.rjust(4, '0')}"
  end

  def generate_account_number
    return if account_number.present?
    
    # Generate account number: ACC + year + sequence
    year = Date.current.year.to_s[-2..-1]
    sequence = Connection.where("account_number LIKE ?", "ACC#{year}%").count + 1
    self.account_number = "ACC#{year}#{sequence.to_s.rjust(6, '0')}"
  end
end