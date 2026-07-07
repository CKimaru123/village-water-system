class MaintenanceSchedule < ApplicationRecord
  belongs_to :asset
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :created_by,  class_name: 'User', optional: true

  validates :maintenance_type, presence: true
  validates :scheduled_date,   presence: true

  scope :scheduled,  -> { where(status: 'scheduled') }
  scope :completed,  -> { where(status: 'completed') }
  scope :overdue,    -> { where(status: 'scheduled').where('scheduled_date < ?', Date.current) }
  scope :upcoming,   -> { where(status: 'scheduled').where('scheduled_date >= ?', Date.current).order(:scheduled_date) }
  scope :recent,     -> { order(scheduled_date: :desc) }
end
