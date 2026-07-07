class Api::V1::Auth::BaseController < ApplicationController
  # Skip authentication for auth endpoints
  skip_before_action :authenticate_request
  
  protected

  def render_user_with_token(user, message = 'Success')
    tokens = JwtService.generate_tokens(user)
    
    render_success({
      user: user_data(user),
      token: tokens[:access_token],
      refresh_token: tokens[:refresh_token],
      expires_at: tokens[:expires_at]
    }, message, :created)
  end

  def user_data(user)
    Rails.logger.info "=== USER_DATA DEBUG ==="
    Rails.logger.info "User ID: #{user.id}"
    Rails.logger.info "Account Type: #{user.account_type}"
    Rails.logger.info "Is Household?: #{user.household?}"
    Rails.logger.info "First Name: #{user.first_name.inspect}"
    Rails.logger.info "Last Name: #{user.last_name.inspect}"
    Rails.logger.info "Full Name: #{user.full_name.inspect}"
    Rails.logger.info "Display Name: #{user.display_name.inspect}"
    Rails.logger.info "========================"
    
    base_data = {
      id: user.id,
      account_type: user.account_type,
      phone: user.phone,
      email: user.email,
      communication_preference: user.communication_preference,
      landmark: user.landmark,
      newsletter_subscription: user.newsletter_subscription,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      display_name: user.display_name,  # Add display_name to base data
      full_name: user.full_name,        # Add full_name to base data
      first_name: user.first_name,      # Always include first_name
      last_name: user.last_name,        # Always include last_name
      avatar: user.avatar               # Add avatar to base data
    }

    # Include persisted language/settings so frontend can apply locale immediately
    base_data[:language_settings] = user.lang_settings if user.respond_to?(:lang_settings)
    # Add account-type specific data
    if user.household?
      base_data.merge({
        alt_phone: user.alt_phone,
        plot_number: user.plot_number,
        household_size: user.household_size,
        village: user.village
      })
    elsif user.institution?
      base_data.merge({
        institution_name: user.institution_name,
        institution_type: user.institution_type,
        contact_person: user.contact_person,
        alt_contact: user.alt_contact,
        population_served: user.population_served,
        storage_capacity: user.storage_capacity
      })
    else
      base_data
    end
  end
end