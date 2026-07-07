class StatusHistory < ApplicationRecord
  belongs_to :user
  belongs_to :changed_by, class_name: 'User'
  belongs_to :related_request, class_name: 'StatusRequest', optional: true

  validates :from_status, presence: true, inclusion: { in: %w[active inactive suspended] }
  validates :to_status, presence: true, inclusion: { in: %w[active inactive suspended] }
  validates :change_type, presence: true, inclusion: { 
    in: %w[admin_action user_request system_auto super_admin_override] 
  }
  validates :reason, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_change_type, ->(type) { where(change_type: type) }
  scope :status_changes_to, ->(status) { where(to_status: status) }
  scope :status_changes_from, ->(status) { where(from_status: status) }

  # Serialize metadata as JSON
  serialize :metadata, coder: JSON

  def self.log_status_change(user:, changed_by:, from_status:, to_status:, reason:, change_type:, related_request: nil, metadata: {})
    create!(
      user: user,
      changed_by: changed_by,
      from_status: from_status,
      to_status: to_status,
      reason: reason,
      change_type: change_type,
      related_request: related_request,
      metadata: metadata
    )
  end

  def change_description
    case change_type
    when 'admin_action'
      "Admin #{changed_by.display_name} changed status from #{from_status} to #{to_status}"
    when 'user_request'
      "User request approved: #{from_status} → #{to_status}"
    when 'system_auto'
      "System automatically changed status: #{from_status} → #{to_status}"
    when 'super_admin_override'
      "Super Admin #{changed_by.display_name} overrode status: #{from_status} → #{to_status}"
    else
      "Status changed from #{from_status} to #{to_status}"
    end
  end

  def formatted_timestamp
    created_at.strftime('%B %d, %Y at %I:%M %p')
  end
end