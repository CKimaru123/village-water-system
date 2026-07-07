class Api::V1::Auth::RegistrationsController < Api::V1::Auth::BaseController
  
  def create
    Rails.logger.info "=== SIGNUP DEBUG ==="
    Rails.logger.info "Raw params: #{params.inspect}"
    Rails.logger.info "User params: #{user_params.inspect}"
    Rails.logger.info "===================="
    
    @user = User.new(user_params)
    
    # Explicitly set role to client for all signups
    # Admins should be created through a separate admin interface
    @user.role = 'client'
    @user.status = 'active'
    
    Rails.logger.info "User before save: #{@user.attributes.inspect}"
    Rails.logger.info "User valid?: #{@user.valid?}"
    Rails.logger.info "User errors: #{@user.errors.full_messages}" unless @user.valid?
    
    if @user.save
      Rails.logger.info "User saved successfully with ID: #{@user.id}"
      render_user_with_token(@user, 'Client account created successfully')
    else
      Rails.logger.error "User save failed: #{@user.errors.full_messages}"
      render_error('Registration failed', format_validation_errors(@user.errors))
    end
  rescue StandardError => e
    Rails.logger.error "Registration error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    
    render_error('An error occurred during registration. Please try again.')
  end

  private

  def user_params
    # Explicitly exclude role and status from permitted params
    # These should only be set by the system or admins
    permitted = params.require(:user).permit(
      # Common fields
      :account_type, :phone, :email, :password, :password_confirmation,
      :communication_preference, :landmark, :newsletter_subscription,
      
      # Household fields
      :first_name, :last_name, :alt_phone, :plot_number, :household_size, :village,
      
      # Institution fields
      :institution_name, :institution_type, :contact_person, :alt_contact,
      :population_served, :storage_capacity
    )
    
    Rails.logger.info "Permitted params: #{permitted.inspect}"
    permitted
  end

  def format_validation_errors(errors)
    formatted_errors = {}
    
    errors.each do |error|
      field = error.attribute
      message = error.message
      
      # Group errors by field
      if formatted_errors[field]
        formatted_errors[field] << message
      else
        formatted_errors[field] = [message]
      end
    end
    
    Rails.logger.info "Formatted errors: #{formatted_errors.inspect}"
    formatted_errors
  end
end