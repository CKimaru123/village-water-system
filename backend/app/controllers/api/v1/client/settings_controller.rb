class Api::V1::Client::SettingsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_client

  # GET /api/v1/client/notification_preferences
  def notification_preferences
    render_success({
      preferences: current_user.notif_prefs,
      communication_preference: current_user.communication_preference,
      newsletter_subscription: current_user.newsletter_subscription,
      available_channels: User.communication_preferences.keys
    }, 'Notification preferences retrieved')
  end

  # PATCH /api/v1/client/notification_preferences
  def update_notification_preferences
    # Merge incoming granular preferences into the stored JSON
    incoming = params[:preferences]&.to_unsafe_h || {}

    # Also allow updating the top-level communication_preference enum
    top_level = {}
    top_level[:communication_preference] = params[:communication_preference] if params[:communication_preference].present?
    top_level[:newsletter_subscription]  = params[:newsletter_subscription]  unless params[:newsletter_subscription].nil?

    # Merge with existing prefs (don't wipe keys not sent)
    merged = current_user.notif_prefs.merge(incoming)
    current_user.notif_prefs = merged

    if current_user.update(top_level.merge(notification_preferences: merged.to_json))
      render_success({
        preferences: current_user.notif_prefs,
        communication_preference: current_user.communication_preference,
        newsletter_subscription: current_user.newsletter_subscription
      }, 'Preferences updated')
    else
      render_error('Failed to update preferences', current_user.errors.full_messages)
    end
  end

  # GET /api/v1/client/language_settings
  def language_settings
    render_success({
      settings: current_user.lang_settings
    }, 'Language settings retrieved')
  end

  # PATCH /api/v1/client/language_settings
  def update_language_settings
    incoming = params[:settings]&.to_unsafe_h || {}
    merged   = current_user.lang_settings.merge(incoming)
    current_user.lang_settings = merged

    if current_user.update(language_settings: merged.to_json)
      render_success({ settings: current_user.lang_settings }, 'Language settings updated')
    else
      render_error('Failed to update language settings', current_user.errors.full_messages)
    end
  end

  # GET /api/v1/client/login_history
  def login_history
    history = ClientProfileAuditLog
                .where(client_id: current_user.id, change_type: 'login')
                .order(created_at: :desc)
                .limit(20)
                .map { |log| { ip_address: log.ip_address, logged_at: log.created_at, user_agent: log.user_agent } }

    render_success({ login_history: history }, 'Login history retrieved')
  end

  private

  def ensure_client
    render_error('Access denied.', [], :forbidden) unless current_user&.client?
  end
end
