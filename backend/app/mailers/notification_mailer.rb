class NotificationMailer < ApplicationMailer
  # Generic notification email — used by NotificationDispatcher
  # @param notification [Notification] the notification record
  def notify(notification)
    setup_common_variables(notification)
    @category = notification.category

    return unless @user.email.present?

    mail(
      to:      @user.email,
      subject: dynamic_subject(notification)
    )
  end

  # Billing alert — invoice due, payment confirmation, etc.
  def billing_alert(notification)
    setup_common_variables(notification)
    @action_url = build_action_url(notification.action_url || '/client/current-bill')

    return unless @user.email.present?

    mail(
      to:      @user.email,
      subject: billing_subject(notification)
    )
  end

  # Usage / leak alert
  def usage_alert(notification)
    setup_common_variables(notification)
    @action_url = build_action_url(notification.action_url || '/client/usage-overview')

    return unless @user.email.present?

    mail(
      to:      @user.email,
      subject: usage_subject(notification)
    )
  end

  # Announcement / community news
  def announcement(notification)
    setup_common_variables(notification)
    @action_url = build_action_url(notification.action_url || '/client/announcements')

    return unless @user.email.present?

    mail(
      to:      @user.email,
      subject: announcement_subject(notification)
    )
  end

  # Maintenance / service interruption notice
  def maintenance_notice(notification)
    setup_common_variables(notification)
    @action_url = build_action_url(notification.action_url || '/client/announcements')

    return unless @user.email.present?

    mail(
      to:      @user.email,
      subject: maintenance_subject(notification)
    )
  end

  # Password reset (existing — kept here for completeness)
  def password_reset(user)
    @user      = user
    @reset_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=#{user.reset_password_token}"
    @expires_in = '2 hours'

    mail(
      to:      user.email,
      subject: '🔐 Password Reset Request — Burguret Water Project'
    )
  end

  private

  def setup_common_variables(notification)
    @notification = notification
    @user         = notification.user
    @title        = notification.title
    @message      = notification.message
    @metadata     = notification.metadata.is_a?(Hash) ? notification.metadata.with_indifferent_access : {}
    @priority     = notification.priority
    @category     = notification.category
    @created_at   = notification.created_at
    @frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    @action_url   = build_action_url(notification.action_url)
  end

  def dynamic_subject(notification)
    prefix     = priority_prefix(notification.priority)
    type_label = notification_type_label(notification.notification_type)
    "#{prefix} #{type_label}: #{notification.title} — Burguret Water Project"
  end

  def billing_subject(notification)
    reference = @metadata[:invoice_number] || @metadata['invoice_number'] || notification.notification_type.to_s.humanize
    "#{priority_prefix(notification.priority)} Billing Update#{reference.present? ? " (#{reference})" : ''}: #{notification.title} — Burguret Water Project"
  end

  def usage_subject(notification)
    "#{priority_prefix(notification.priority)} Usage Alert: #{notification.title} — Burguret Water Project"
  end

  def announcement_subject(notification)
    "📢 Announcement: #{notification.title} — Burguret Water Project"
  end

  def maintenance_subject(notification)
    "#{priority_prefix(notification.priority)} Maintenance Notice: #{notification.title} — Burguret Water Project"
  end

  def priority_prefix(priority)
    case priority
    when 'urgent' then '🚨 Urgent'
    when 'high'   then '⚠️ High Priority'
    when 'normal' then 'ℹ️'
    else '💧'
    end
  end

  def notification_type_label(notification_type)
    case notification_type
    when 'invoice', 'billing_updated', 'payment_received', 'dunning', 'subsidy', 'refund'
      'Billing'
    when 'service_disconnected', 'service_connected', 'connection', 'meter_reading', 'supply_interruption', 'leak_alert'
      'Service'
    when 'announcement', 'general_announcement', 'event', 'poll'
      'Announcement'
    when 'system_maintenance', 'maintenance'
      'Maintenance'
    when 'ticket', 'ticket_update', 'ticket_resolved', 'escalation'
      'Support'
    when 'document_verified', 'document_rejected'
      'Document'
    else
      notification_type.to_s.humanize
    end
  end

  def build_action_url(path)
    return nil if path.blank?
    return path if path.match?(%r{\Ahttps?://})
    "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3000')}#{path}"
  end
end
