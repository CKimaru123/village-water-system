class Ticket < ApplicationRecord
  belongs_to :user
  belongs_to :assigned_to, class_name: 'User', optional: true
  has_many :ticket_updates, dependent: :destroy

  enum :status, { open: 'open', in_progress: 'in_progress', resolved: 'resolved', closed: 'closed' }
  enum :priority, { low: 'low', normal: 'normal', high: 'high', urgent: 'urgent' }
  # Note: using ticket_category to avoid conflict with AR's .connection method
  enum :category, {
    billing: 'billing',
    leak: 'leak',
    water_quality: 'water_quality',
    service_connection: 'connection',
    meter: 'meter',
    general: 'general',
    complaint: 'complaint'
  }, prefix: :cat

  validates :subject, presence: true
  validates :description, presence: true
  validates :category, presence: true
  validates :priority, presence: true
  validates :status, presence: true

  before_validation :set_defaults, on: :create

  # When a ticket is resolved or closed, record the resolution time for SLA tracking
  after_update :record_sla_resolution, if: :saved_change_to_status?

  scope :recent, -> { order(created_at: :desc) }
  scope :open_tickets, -> { where(status: ['open', 'in_progress']) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }

  def ticket_number
    "TKT-#{id.to_s.rjust(6, '0')}"
  end

  # Hours the ticket was open before resolution (nil if still open)
  def sla_resolution_hours
    return nil unless resolved_at.present?
    ((resolved_at - created_at) / 3600.0).round(2)
  end

  # Whether this ticket breached the 48-hour SLA
  def sla_breached?
    hours = sla_resolution_hours || ((Time.current - created_at) / 3600.0)
    hours > 48
  end

  private

  def set_defaults
    self.status ||= 'open'
    self.priority ||= 'normal'
  end

  def record_sla_resolution
    if %w[resolved closed].include?(status)
      # Stamp resolved_at if not already set
      update_column(:resolved_at, Time.current) if resolved_at.nil?

      # Log SLA breach to audit log if it took > 48 hours
      if sla_breached?
        AuditLog.create!(
          user_id: assigned_to_id || user_id,
          action: 'sla_breach',
          resource_type: 'Ticket',
          resource_id: id,
          details: {
            ticket_number: ticket_number,
            hours_open: sla_resolution_hours,
            sla_threshold_hours: 48
          }.to_json
        ) rescue nil
      end
    end
  end
end
