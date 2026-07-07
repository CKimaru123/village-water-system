class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAIL_FROM', "Kiragu Collins <#{ENV.fetch('GMAIL_USERNAME', 'kiragucollins@gmail.com')}>")
  layout 'mailer'
end
