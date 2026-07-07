class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :related_user, class_name: 'User', optional: true

  validates :title, presence: true
  validates :message, presence: true
  validates :notification_type, presence: true
  validates :priority, inclusion: { in: %w[low normal high urgent] }
  validates :category, inclusion: { in: %w[profile billing service system general meeting support document status alert community announcement incident] }

  scope :unread, -> { where(read: false) }
  scope :read, -> { where(read: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_priority, -> { order(Arel.sql("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END")) }
  scope :active, -> { where('expires_at IS NULL OR expires_at > ?', Time.current) }

  # Broadcast to the user's ActionCable channel after creation
  after_create_commit :broadcast_to_user
  # Dispatch to external channels (email, SMS, WhatsApp) based on user preferences
  after_create_commit :dispatch_to_channels

  private

  def broadcast_to_user
    channel = user.client? ? "client_#{user_id}" : "admin_updates"
    Rails.logger.info "[Notification] Broadcasting notification=#{id} to channel=#{channel} user=#{user_id}"
    ActionCable.server.broadcast(channel, {
      type: 'new_notification',
      user_id: user_id,
      notification: {
        id: id,
        title: title,
        message: message,
        notification_type: notification_type,
        category: category,
        priority: priority,
        read: read,
        created_at: created_at,
        action_url: action_url,
        time_ago: time_ago
      }
    })
  rescue => e
    Rails.logger.error "Notification broadcast error: #{e.message}"
  end

  def dispatch_to_channels
    NotificationDispatcher.dispatch(self)
  rescue => e
    Rails.logger.error "Notification dispatch error: #{e.message}"
  end

  public

  # Notification types
  TYPES = {
    profile_updated: 'profile_updated',
    profile_created: 'profile_created',
    billing_updated: 'billing_updated',
    service_disconnected: 'service_disconnected',
    service_connected: 'service_connected',
    payment_received: 'payment_received',
    meeting_scheduled: 'meeting_scheduled',
    system_maintenance: 'system_maintenance',
    general_announcement: 'general_announcement'
  }.freeze

  def mark_as_read!
    update!(read: true, read_at: Time.current)
  end

  def mark_as_unread!
    update!(read: false, read_at: nil)
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def formatted_created_at
    created_at.strftime("%B %d, %Y at %I:%M %p")
  end

  def time_ago
    time_diff = Time.current - created_at
    
    case time_diff
    when 0..59
      "#{time_diff.to_i} seconds ago"
    when 60..3599
      "#{(time_diff / 60).to_i} minutes ago"
    when 3600..86399
      "#{(time_diff / 3600).to_i} hours ago"
    when 86400..2591999
      "#{(time_diff / 86400).to_i} days ago"
    else
      formatted_created_at
    end
  end

  # Class methods for creating specific notification types
  def self.create_profile_update_notification(client, modified_by, updated_fields)
    create!(
      user: client,
      related_user: modified_by,
      title: 'Profile Updated',
      message: "Your profile was updated by #{modified_by.display_name} (#{modified_by.role.humanize}). Fields changed: #{updated_fields.join(', ')}",
      notification_type: TYPES[:profile_updated],
      category: 'profile',
      priority: 'normal',
      metadata: {
        updated_fields: updated_fields,
        modified_by_id: modified_by.id,
        modified_by_name: modified_by.display_name,
        modified_by_role: modified_by.role
      },
      action_url: '/client/profile-history'
    )
  end

  def self.create_admin_notification(admin, client, action, details = {})
    create!(
      user: admin,
      related_user: client,
      title: "Client #{action.humanize}",
      message: "Client #{client.display_name} profile #{action}. #{details[:message] || ''}",
      notification_type: TYPES[:profile_updated],
      category: 'profile',
      priority: 'low',
      metadata: details.merge({
        client_id: client.id,
        client_name: client.display_name,
        action: action
      }),
      action_url: "/admin/client-lookup?search=#{client.phone}"
    )
  end
end