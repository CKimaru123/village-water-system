# NotificationDispatcher
#
# Called after a Notification record is created. Checks the user's
# per-type per-channel preferences and dispatches to Email (and later
# SMS / WhatsApp) accordingly.
#
# Usage:
#   NotificationDispatcher.dispatch(notification)
#
# The notification_type maps to a preference key prefix:
#   profile_updated       → "profile_alerts"
#   billing_updated       → "billing_alerts"
#   payment_received      → "billing_alerts"
#   service_disconnected  → "usage_alerts"
#   service_connected     → "usage_alerts"
#   general_announcement  → "announcements"
#   meeting_scheduled     → "events"
#   system_maintenance    → "maintenance"
#
class NotificationDispatcher
  # Map notification_type values to preference key prefixes
  TYPE_TO_PREF_KEY = {
    'profile_updated'      => 'profile_alerts',
    'profile_created'      => 'profile_alerts',
    'billing_updated'      => 'billing_alerts',
    'invoice'              => 'billing_alerts',
    'payment_received'     => 'billing_alerts',
    'dunning'              => 'billing_alerts',
    'subsidy'              => 'billing_alerts',
    'refund'               => 'billing_alerts',
    'service_disconnected' => 'usage_alerts',
    'service_connected'    => 'usage_alerts',
    'connection'           => 'usage_alerts',
    'meter_reading'        => 'usage_alerts',
    'supply_interruption'  => 'usage_alerts',
    'leak_alert'           => 'usage_alerts',
    'general_announcement' => 'announcements',
    'announcement'         => 'announcements',
    'event'                => 'announcements',
    'poll'                 => 'announcements',
    'system_maintenance'   => 'maintenance',
    'maintenance'          => 'maintenance',
    'alert'                => 'usage_alerts',
    'community'            => 'announcements',
    'incident'             => 'maintenance',
    'ticket'               => 'support_alerts',
    'ticket_update'        => 'support_alerts',
    'ticket_resolved'      => 'support_alerts',
    'escalation'           => 'support_alerts',
    'status_request'       => 'support_alerts',
    'status_approved'      => 'support_alerts',
    'status_denied'        => 'support_alerts',
    'document_verified'    => 'support_alerts',
    'document_rejected'    => 'support_alerts',
  }.freeze

  # Map preference key prefix to the mailer method to call
  PREF_TO_MAILER_METHOD = {
    'billing_alerts'  => :billing_alert,
    'usage_alerts'    => :usage_alert,
    'announcements'   => :announcement,
    'maintenance'     => :maintenance_notice,
    'support_alerts'  => :notify,
  }.freeze

  def self.dispatch(notification)
    new(notification).dispatch
  end

  def initialize(notification)
    @notification = notification
    @user         = notification.user
  end

  def dispatch
    # Respect quiet hours — skip external channels (in-app already delivered)
    if @user.in_quiet_hours?
      Rails.logger.info "[NotificationDispatcher] Quiet hours active for user #{@user.id} — skipping external channels"
      return
    end

    Rails.logger.info "[NotificationDispatcher] Dispatching notification=#{@notification.id} to user=#{@user.id} type=#{@notification.notification_type} email_flag=#{@notification.metadata.is_a?(Hash) ? @notification.metadata['send_email'] : nil}"

    pref_key = TYPE_TO_PREF_KEY[@notification.notification_type] || 'announcements'
    dispatch_email(pref_key) if should_send_email?(pref_key)
    dispatch_sms(pref_key) if @user.wants_notification?(pref_key, 'sms') && @user.phone.present?
    dispatch_whatsapp(pref_key) if @user.wants_notification?(pref_key, 'whatsapp') && @user.phone.present?
  rescue => e
    Rails.logger.error "[NotificationDispatcher] Error dispatching notification #{@notification.id}: #{e.message}"
    Rails.logger.error e.backtrace.first(5).join("\n")
  end

  def dispatch_sms(pref_key)
    return unless MacosSmsService.configured?

    Rails.logger.info "[NotificationDispatcher] Sending SMS via macOS to #{@user.phone} (#{pref_key})"
    MacosSmsService.send_sms(
      to: @user.phone,
      body: sms_body
    )
  rescue => e
    Rails.logger.error "[NotificationDispatcher] SMS delivery failed for user #{@user.id}: #{e.message}"
  end

  def dispatch_whatsapp(pref_key)
    return unless WhatsAppService.configured?

    Rails.logger.info "[NotificationDispatcher] Sending WhatsApp to #{@user.phone} (#{pref_key})"
    WhatsAppService.send_message(
      to: @user.phone, # make sure this is stored **without** the leading '+'
      body: whatsapp_body #"Hello from the Village Water System – test message!"
    )
  rescue => e
    Rails.logger.error "[NotificationDispatcher] WhatsApp delivery failed for user #{@user.id}: #{e.message}"
  end

  def sms_body
    message = "#{@notification.title}: #{@notification.message}"
    if @notification.action_url.present?
      action_url = @notification.action_url.start_with?('http') ? @notification.action_url : "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3000')}#{@notification.action_url}"
      message += " — More: #{action_url}"
    end
    message.truncate(280)
  end

  def whatsapp_body
    message = "#{@notification.title}: #{@notification.message}"
    if @notification.action_url.present?
      action_url = @notification.action_url.start_with?('http') ? @notification.action_url : "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3000')}#{@notification.action_url}"
      message += " — More: #{action_url}"
    end
    message.truncate(280)
  end

  def should_send_email?(pref_key)
    send_email_flag = @notification.metadata.is_a?(Hash) && @notification.metadata['send_email'] == true
    suppress_email  = @notification.metadata.is_a?(Hash) && @notification.metadata['send_email'] == false

    return false if suppress_email
    return true if send_email_flag && @user.email.present?

    @user.wants_notification?(pref_key, 'email') && @user.email.present?
  end

  private

  def dispatch_email(pref_key)
    mailer_method = PREF_TO_MAILER_METHOD[pref_key] || :notify

    Rails.logger.info "[NotificationDispatcher] Sending email to #{@user.email} via #{mailer_method} (#{pref_key})"

    # Use deliver_now for synchronous delivery.
    # Switch to deliver_later once Sidekiq/Resque is configured.
    mail = NotificationMailer.send(mailer_method, @notification).deliver_now
    Rails.logger.info "[NotificationDispatcher] Email delivered for notification=#{@notification.id} to #{@user.email} message_id=#{mail.message_id}" if mail.respond_to?(:message_id)
  rescue => e
    Rails.logger.error "[NotificationDispatcher] Email delivery failed for user #{@user.id}: #{e.message}"
  end
end
