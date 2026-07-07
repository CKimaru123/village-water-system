class Api::V1::Auth::PasswordResetsController < Api::V1::Auth::BaseController
  # BaseController already skips authenticate_request for all auth endpoints

  # POST /api/v1/auth/forgot-password
  # Accepts { email: "..." } or { phone: "..." }
  def create
    user = find_user_by_identifier

    # Always return success to prevent user enumeration
    unless user
      return render json: {
        success: true,
        message: "If an account with that email exists, a reset link has been sent."
      }
    end

    unless user.email.present?
      return render json: {
        success: false,
        message: "No email address on file for this account. Please contact support."
      }, status: :unprocessable_entity
    end

    # Generate a secure token and set expiry (2 hours)
    token = SecureRandom.urlsafe_base64(32)
    user.update!(
      reset_password_token: token,
      reset_password_sent_at: Time.current
    )

    # Send the email (letter_opener will open it in browser during dev)
    UserMailer.password_reset(user).deliver_now

    render json: {
      success: true,
      message: "Password reset link sent to #{user.email}"
    }
  rescue => e
    Rails.logger.error "Password reset error: #{e.message}"
    render json: { success: false, message: "Failed to send reset email. Please try again." }, status: :internal_server_error
  end

  # POST /api/v1/auth/reset-password
  # Accepts { token: "...", password: "...", password_confirmation: "..." }
  def reset
    token = params[:token]
    password = params[:password]
    password_confirmation = params[:password_confirmation]

    if token.blank? || password.blank?
      return render json: { success: false, message: "Token and password are required." }, status: :unprocessable_entity
    end

    if password != password_confirmation
      return render json: { success: false, message: "Passwords do not match." }, status: :unprocessable_entity
    end

    user = User.find_by(reset_password_token: token)

    unless user
      return render json: { success: false, message: "Invalid or expired reset link." }, status: :unprocessable_entity
    end

    # Check token expiry (2 hours)
    if user.reset_password_sent_at < 2.hours.ago
      user.update!(reset_password_token: nil, reset_password_sent_at: nil)
      return render json: { success: false, message: "Reset link has expired. Please request a new one." }, status: :unprocessable_entity
    end

    # Update password and clear token
    if user.update(password: password, reset_password_token: nil, reset_password_sent_at: nil)
      render json: { success: true, message: "Password reset successfully. You can now log in." }
    else
      render json: {
        success: false,
        message: "Failed to reset password.",
        errors: user.errors.full_messages
      }, status: :unprocessable_entity
    end
  rescue => e
    Rails.logger.error "Password reset error: #{e.message}"
    render json: { success: false, message: "An error occurred. Please try again." }, status: :internal_server_error
  end

  private

  def find_user_by_identifier
    if params[:email].present?
      User.find_by(email: params[:email])
    elsif params[:phone].present?
      User.find_by(phone: params[:phone])
    end
  end
end
