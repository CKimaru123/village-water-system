class Api::V1::Auth::SessionsController < Api::V1::Auth::BaseController
  
  # Login endpoint
  def create
    Rails.logger.info "=== LOGIN DEBUG ==="
    Rails.logger.info "Login params: #{login_params.inspect}"
    
    # Find user by phone or email
    user = nil
    if login_params[:phone].present?
      user = User.find_by(phone: login_params[:phone])
      Rails.logger.info "Looking for user by phone: #{login_params[:phone]}"
    elsif login_params[:email].present?
      user = User.find_by(email: login_params[:email])
      Rails.logger.info "Looking for user by email: #{login_params[:email]}"
    end
    
    Rails.logger.info "User found: #{user ? "Yes (ID: #{user.id}, Role: #{user.role})" : "No"}"
    
    if user&.authenticate(login_params[:password])
      Rails.logger.info "Password authentication: Success"
      if user.active?
        Rails.logger.info "User status: Active - Login successful"
        
        # Update the updated_at timestamp to reflect login time
        user.touch # This updates the updated_at field to current time

        AuditLog.log(user: user, action: 'login', details: "IP: #{request.remote_ip}")
        
        render_user_with_token(user, 'Login successful')
      else
        Rails.logger.warn "User status: #{user.status} - Login denied"
        render_error('Account is inactive. Please contact support.')
      end
    else
      Rails.logger.warn "Authentication failed for identifier: #{login_params[:phone] || login_params[:email]}"
      render_error('Invalid credentials. Please check your phone/email and password.')
    end
  rescue StandardError => e
    Rails.logger.error "Login error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render_error('An error occurred during login. Please try again.')
  end

  # Get current user info
  def show
    # Re-enable authentication for this action
    authenticate_request
    return unless @current_user # Return early if authentication failed
    
    # Return the timezone-adjusted updated_at for all timestamp needs
    timestamp = current_user.formatted_updated_at_with_timezone
    
    render_success({
      user: user_data(current_user),
      updated_at_with_timezone: timestamp,  # Single timestamp for all uses
      last_login_at: timestamp,             # Use same timestamp
      password_changed_at: timestamp        # Use same timestamp
    }, 'User information retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Get user error: #{e.message}"
    render_error('Unable to retrieve user information.') unless performed?
  end

  # Update user profile
  def update
    authenticate_request
    return unless @current_user # Return early if authentication failed
    
    Rails.logger.info "=== UPDATE PROFILE DEBUG ==="
    Rails.logger.info "Update params: #{update_params.inspect}"
    Rails.logger.info "Current user: #{current_user ? "Yes (ID: #{current_user.id})" : "No"}"
    
    if current_user.update(update_params)
      Rails.logger.info "Profile updated successfully"
      
      # Return updated user data
      timestamp = current_user.formatted_updated_at_with_timezone
      
      render_success({
        user: user_data(current_user),
        updated_at_with_timezone: timestamp
      }, 'Profile updated successfully')
    else
      Rails.logger.error "Profile update failed: #{current_user.errors.full_messages}"
      render_error('Failed to update profile.', current_user.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Update profile error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render_error('An error occurred while updating profile. Please try again.')
  end

  # Logout endpoint
  def destroy
    # In a more complex setup, you might want to blacklist the token
    # For now, we'll just return success (client should remove token)
    render_success({}, 'Logged out successfully')
  end

  # Change password endpoint
  def change_password
    authenticate_request
    
    Rails.logger.info "=== CHANGE PASSWORD DEBUG ==="
    Rails.logger.info "Change password params: #{change_password_params.inspect}"
    Rails.logger.info "Current user: #{current_user ? "Yes (ID: #{current_user.id})" : "No"}"
    
    # Validate current password
    unless current_user.authenticate(change_password_params[:current_password])
      Rails.logger.warn "Current password authentication failed"
      return render_error('Current password is incorrect.')
    end
    
    # Validate new password
    if change_password_params[:new_password] != change_password_params[:password_confirmation]
      Rails.logger.warn "Password confirmation mismatch"
      return render_error('New password and confirmation do not match.')
    end
    
    # Update password
    if current_user.update(password: change_password_params[:new_password])
      Rails.logger.info "Password updated successfully"
      
      # Use the updated_at + 3 hours timestamp (updated_at was just updated by the save)
      timestamp = current_user.formatted_updated_at_with_timezone
      adjusted_time = current_user.updated_at + 3.hours
      expires_at = adjusted_time + 6.months
      
      render_success({
        message: 'Password changed successfully',
        password_changed_at: timestamp,  # Use the timezone-adjusted updated_at
        last_changed: adjusted_time.strftime('%Y-%m-%d %H:%M:%S'),
        expires_at: expires_at.strftime('%Y-%m-%d %H:%M:%S'),
        last_changed_iso: adjusted_time.iso8601,
        expires_at_iso: expires_at.iso8601
      }, 'Password changed successfully')
    else
      Rails.logger.error "Password update failed: #{current_user.errors.full_messages}"
      render_error('Failed to update password.', current_user.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Change password error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render_error('An error occurred while changing password. Please try again.')
  end

  # Refresh token endpoint
  def refresh
    refresh_token = params[:refresh_token]
    
    if refresh_token.blank?
      return render_error('Refresh token is required.')
    end

    user = JwtService.get_user_from_token(refresh_token)
    
    if user
      tokens = JwtService.generate_tokens(user)
      render_success({
        token: tokens[:access_token],
        refresh_token: tokens[:refresh_token],
        expires_at: tokens[:expires_at]
      }, 'Token refreshed successfully')
    else
      render_error('Invalid or expired refresh token.')
    end
  rescue StandardError => e
    Rails.logger.error "Token refresh error: #{e.message}"
    render_error('Unable to refresh token.')
  end

  private

  def login_params
    permitted = params.require(:user).permit(:phone, :email, :password)
    Rails.logger.info "Permitted login params: #{permitted.inspect}"
    permitted
  end

  def change_password_params
    permitted = params.permit(:current_password, :new_password, :password_confirmation)
    Rails.logger.info "Permitted change password params: #{permitted.inspect}"
    permitted
  end

  def update_params
    permitted = params.require(:user).permit(
      :first_name, :last_name, :email, :alt_phone, :plot_number, 
      :household_size, :village, :landmark, :communication_preference,
      :institution_name, :institution_type, :contact_person, :population_served, :alt_contact, :storage_capacity,
      :avatar
    )
    Rails.logger.info "Permitted update params: #{permitted.inspect}"
    permitted
  end

  def authenticate_request
    super
  end
end