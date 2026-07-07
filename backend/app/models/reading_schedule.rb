class ReadingSchedule < ApplicationRecord
  belongs_to :meter,      optional: true   # null = global default
  belongs_to :created_by, class_name: 'User', foreign_key: :created_by_id, optional: true

  SCHEDULE_TYPES = %w[interval_minutes interval_hours daily_at end_of_month].freeze

  validates :schedule_type, presence: true, inclusion: { in: SCHEDULE_TYPES }
  validates :interval_value,
            presence: true,
            numericality: { only_integer: true, greater_than: 0 },
            if: -> { schedule_type.in?(%w[interval_minutes interval_hours]) }
  validates :interval_value,
            numericality: { greater_than_or_equal_to: 1 },
            if: -> { schedule_type == 'interval_minutes' }
  validates :daily_time,
            presence: true,
            format: { with: /\A([01]\d|2[0-3]):[0-5]\d\z/, message: 'must be in HH:MM format' },
            if: -> { schedule_type == 'daily_at' }
  validate  :only_one_global_default, if: -> { meter_id.nil? }
  validate  :only_one_per_meter,      if: -> { meter_id.present? }

  scope :global_default, -> { where(meter_id: nil, active: true).order(created_at: :desc) }
  scope :for_meter,      ->(mid) { where(meter_id: mid, active: true).order(created_at: :desc) }

  # Returns the effective schedule for a meter: per-meter override first, then global default
  def self.effective_for(meter)
    for_meter(meter.id).first || global_default.first
  end

  def global?
    meter_id.nil?
  end

  # Human-readable description of the schedule
  def description
    case schedule_type
    when 'interval_minutes' then "Every #{interval_value} minute(s)"
    when 'interval_hours'   then "Every #{interval_value} hour(s)"
    when 'daily_at'         then "Daily at #{daily_time}"
    when 'end_of_month'     then 'End of month'
    end
  end

  private

  def only_one_global_default
    existing = ReadingSchedule.where(meter_id: nil, active: true)
    existing = existing.where.not(id: id) if persisted?
    errors.add(:base, 'A global default reading schedule already exists. Update it instead.') if existing.exists?
  end

  def only_one_per_meter
    existing = ReadingSchedule.where(meter_id: meter_id, active: true)
    existing = existing.where.not(id: id) if persisted?
    errors.add(:meter, 'already has an active reading schedule. Update it instead.') if existing.exists?
  end
end
