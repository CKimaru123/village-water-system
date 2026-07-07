class ClientProfileAuditLog < ApplicationRecord
  belongs_to :client, class_name: 'User'
  belongs_to :modified_by, class_name: 'User'
  belongs_to :approved_by, class_name: 'User', optional: true

  validates :field_name, presence: true
  validates :change_type, presence: true, inclusion: { in: %w[create update delete] }
  validates :change_category, inclusion: { in: %w[contact_info identity service security communication account_management] }
  validates :sensitivity_level, inclusion: { in: %w[low medium high] }
  validates :approval_status, inclusion: { in: %w[pending approved rejected] }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_client, ->(client_id) { where(client_id: client_id) }
  scope :by_category, ->(category) { where(change_category: category) }
  scope :by_sensitivity, ->(level) { where(sensitivity_level: level) }
  scope :pending_approval, -> { where(approval_status: 'pending') }
  scope :high_sensitivity, -> { where(sensitivity_level: 'high') }

  def self.log_change(client:, modified_by:, field_name:, old_value:, new_value:, reason: nil, request: nil)
    change_info = categorize_change(field_name)
    
    create!(
      client: client,
      modified_by: modified_by,
      field_name: field_name,
      old_value: old_value&.to_s,
      new_value: new_value&.to_s,
      change_type: 'update',
      reason: reason,
      change_category: change_info[:category],
      sensitivity_level: change_info[:sensitivity],
      requires_approval: change_info[:requires_approval],
      approval_status: change_info[:requires_approval] ? 'pending' : 'approved',
      ip_address: request&.remote_ip,
      user_agent: request&.user_agent,
      additional_metadata: {
        modified_by_role: modified_by.role,
        client_account_type: client.account_type,
        timestamp: Time.current.iso8601
      }
    )
  end

  def self.categorize_change(field_name)
    case field_name.to_s
    when 'phone', 'alt_phone', 'email', 'landmark', 'village'
      { category: 'contact_info', sensitivity: 'low', requires_approval: false }
    when 'first_name', 'last_name', 'institution_name', 'contact_person', 'account_type'
      { category: 'identity', sensitivity: 'high', requires_approval: true }
    when 'plot_number', 'household_size', 'population_served', 'storage_capacity'
      { category: 'service', sensitivity: 'medium', requires_approval: false }
    when 'communication_preference', 'newsletter_subscription'
      { category: 'communication', sensitivity: 'low', requires_approval: false }
    when 'password', 'status'
      { category: 'security', sensitivity: 'high', requires_approval: true }
    else
      { category: 'service', sensitivity: 'medium', requires_approval: false }
    end
  end

  def formatted_timestamp
    created_at.strftime("%B %d, %Y at %I:%M %p")
  end

  def change_description
    case change_type
    when 'create'
      "Created #{field_name}"
    when 'update'
      "Changed #{field_name.humanize} from '#{old_value}' to '#{new_value}'"
    when 'delete'
      "Deleted #{field_name}"
    end
  end

  def notification_required?
    sensitivity_level.in?(['medium', 'high']) || change_category == 'security'
  end

  def immediate_notification_required?
    sensitivity_level == 'high' || change_category == 'security'
  end
end