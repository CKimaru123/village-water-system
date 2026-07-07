# SendGrid support is deprecated in this app.
# The Rails mailer is configured to use Gmail SMTP by default.
# Leave this initializer in place only for legacy log messaging.

sendgrid_key = ENV['SENDGRID_API_KEY'].to_s

if sendgrid_key.start_with?('SG.')
  Rails.logger.info "[SendGrid] Configured, but Gmail SMTP delivery is preferred unless explicitly overridden in environment config."
else
  Rails.logger.info "[SendGrid] Not configured — using Rails environment default delivery method."
end
