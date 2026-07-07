class AddNotificationPreferencesToUsers < ActiveRecord::Migration[8.1]
  def change
    # Granular per-type per-channel preferences stored as JSON
    # e.g. { "billing_alerts_email": true, "billing_alerts_sms": false,
    #         "quiet_hours_enabled": true, "quiet_hours_from": "22:00",
    #         "quiet_hours_to": "07:00", "digest_frequency": "immediate" }
    add_column :users, :notification_preferences, :text, default: '{}'

    # Language and regional settings stored as JSON
    # e.g. { "language": "en", "timezone": "Africa/Nairobi",
    #         "date_format": "DD/MM/YYYY", "number_format": "en" }
    add_column :users, :language_settings, :text, default: '{}'
  end
end
