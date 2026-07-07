class Appeal < ApplicationRecord
  belongs_to :user
  belongs_to :original_action, class_name: 'StatusHistory'
  belongs_to :reviewed_by, class_name: 'User', optional: true

  validates :reason, presence: true, length: { minimum: 10 }
  validates :status, presence: true, inclusion: { in: %w[pending under_review approved denied] }
  validates :priority, presence: true, inclusion: { in: %w[low normal high urgent] }

  scope :pending, -> { where(status: 'pending') }
  scope :under_review, -> { where(status: 'under_review') }
  scope :approved, -> { where(status: 'approved') }
  scope :denied, -> { where(status: 'denied') }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :recent, -> { order(created_at: :desc) }
  scope :high_priority, -> { where(priority: ['high', 'urgent']) }

  # Serialize supporting documents as JSON
  serialize :supporting_documents, coder: JSON

  def can_be_reviewed?
    %w[pending under_review].include?(status)
  end

  def approve!(reviewed_by_user, resolution_text)
    transaction do
      update!(
        status: 'approved',
        reviewed_by: reviewed_by_user,
        reviewed_at: Time.current,
        resolution: resolution_text
      )
      
      # Revert the original status change if appropriate
      if should_revert_status?
        user.update!(status: original_action.from_status)
        
        # Log the status reversion
        StatusHistory.log_status_change(
          user: user,
          changed_by: reviewed_by_user,
          from_status: original_action.to_status,
          to_status: original_action.from_status,
          reason: "Appeal approved: #{resolution_text}",
          change_type: 'super_admin_override',
          metadata: { appeal_id: id, original_action_id: original_action.id }
        )
      end
    end
  end

  def deny!(reviewed_by_user, resolution_text)
    update!(
      status: 'denied',
      reviewed_by: reviewed_by_user,
      reviewed_at: Time.current,
      resolution: resolution_text
    )
  end

  def mark_under_review!(reviewed_by_user)
    update!(
      status: 'under_review',
      reviewed_by: reviewed_by_user,
      reviewed_at: Time.current
    )
  end

  def priority_color
    case priority
    when 'urgent' then 'error'
    when 'high' then 'warning'
    when 'normal' then 'info'
    when 'low' then 'success'
    end
  end

  def days_since_submitted
    (Date.current - created_at.to_date).to_i
  end

  def is_overdue?
    case priority
    when 'urgent' then days_since_submitted > 1
    when 'high' then days_since_submitted > 3
    when 'normal' then days_since_submitted > 7
    when 'low' then days_since_submitted > 14
    end
  end

  private

  def should_revert_status?
    # Logic to determine if the original status change should be reverted
    # This could be based on the type of original action, current user status, etc.
    original_action.change_type.in?(['admin_action', 'system_auto']) && 
    user.status == original_action.to_status
  end
end