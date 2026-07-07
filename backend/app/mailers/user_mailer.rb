class UserMailer < ApplicationMailer
  default from: ENV.fetch('MAIL_FROM', ENV.fetch('GMAIL_USERNAME', 'noreply@village-water-system.com'))

  def password_reset(user)
    @user = user
    @reset_url = "http://localhost:3000/reset-password?token=#{user.reset_password_token}"
    @expires_in = "2 hours"

    mail(
      to: user.email,
      subject: "Village Water System - Password Reset Request"
    )
  end
end
