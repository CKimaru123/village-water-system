class Incident < ApplicationRecord
  belongs_to :asset,       optional: true
  belongs_to :ticket,      optional: true
  belongs_to :reported_by, class_name: 'User', optional: true
  belongs_to :assigned_to, class_name: 'User', optional: true

  validates :title,         presence: true
  validates :incident_type, presence: true

  scope :open,     -> { where(status: 'open') }
  scope :resolved, -> { where(status: 'resolved') }
  scope :recent,   -> { order(created_at: :desc) }
  scope :by_type,  ->(type) { where(incident_type: type) }
  scope :critical, -> { where(severity: 'critical') }
end
