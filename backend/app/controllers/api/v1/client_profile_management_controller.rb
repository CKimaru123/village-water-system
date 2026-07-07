class Api::V1::ClientProfileManagementController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin_or_super_admin
  before_action :set_client, only: [:show, :update, :permissions, :audit_trail]

  # GET /api/v1/client_profile_management/:id
  def show
    permissions = ClientProfilePermissions.new(current_user, @client)
    
    render_success({
      client: detailed_client_data(@client),
      permissions: permissions.to_hash,
      field_permissions: permissions.field_permissions,
      can_edit: permissions.can_edit_contact_info? || permissions.can_edit_identity?
    }, 'Client profile retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Client profile show error: #{e.message}"
    render_error('Unable to retrieve client profile.')
  end

  # GET /api/v1/client_profile_management/:id/permissions
  def permissions
    permissions = ClientProfilePermissions.new(current_user, @client)
    
    render_success({
      permissions: permissions.to_hash,
      field_permissions: permissions.field_permissions,
      user_role: current_user.role
    }, 'Permissions retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Client permissions error: #{e.message}"
    render_error('Unable to retrieve permissions.')
  end

  # PATCH/PUT /api/v1/client_profile_management/:id
  def update
    permissions = ClientProfilePermissions.new(current_user, @client)
    
    # Validate permissions for each field being updated
    update_params = client_update_params
    unauthorized_fields = []
    validation_errors = {}
    
    update_params.each do |field, value|
      unless can_edit_field?(permissions, field)
        unauthorized_fields << field
      end
      
      # Validate field value
      field_error = validate_field(field, value)
      if field_error
        validation_errors[field] = field_error
      end
    end
    
    if unauthorized_fields.any?
      render_error("Insufficient permissions to edit: #{unauthorized_fields.join(', ')}")
      return
    end
    
    if validation_errors.any?
      render_error('Validation failed', validation_errors, :unprocessable_entity)
      return
    end
    
    # Store original values for audit trail
    original_values = {}
    update_params.keys.each do |field|
      original_values[field] = @client.send(field)
    end
    
    # Perform update
    if @client.update(update_params)
      # Log changes to audit trail and send real-time notifications
      audit_logs = []
      update_params.each do |field, new_value|
        old_value = original_values[field]
        if old_value != new_value
          audit_log = ClientProfileAuditLog.log_change(
            client: @client,
            modified_by: current_user,
            field_name: field,
            old_value: old_value,
            new_value: new_value,
            reason: params[:reason],
            request: request
          )
          audit_logs << audit_log
        end
      end
      
      # Send real-time notifications
      if audit_logs.any?
        RealTimeNotificationService.notify_profile_update(
          @client.id, 
          update_params.keys, 
          current_user
        )
        
        # Send individual audit log notifications
        audit_logs.each do |audit_log|
          RealTimeNotificationService.notify_audit_log_update(@client.id, audit_log)
        end
      end
      
      # Send notifications if required
      schedule_client_notifications(update_params.keys)
      
      render_success({
        client: detailed_client_data(@client),
        updated_fields: update_params.keys,
        audit_logged: true
      }, 'Client profile updated successfully')
    else
      render_error('Failed to update client profile', @client.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Client profile update error: #{e.message}"
    render_error('An error occurred while updating client profile.')
  end

  # GET /api/v1/client_profile_management/:id/audit_trail
  def audit_trail
    permissions = ClientProfilePermissions.new(current_user, @client)
    
    unless permissions.can_view_audit_trail?
      render_error('Insufficient permissions to view audit trail.', [], :forbidden)
      return
    end
    
    @audit_logs = ClientProfileAuditLog.for_client(@client.id).recent.limit(50)
    
    # Filter sensitive information for non-super admins
    unless permissions.can_view_full_audit_trail?
      @audit_logs = @audit_logs.where.not(sensitivity_level: 'high')
    end
    
    render_success({
      audit_logs: @audit_logs.map { |log| audit_log_data(log) },
      can_view_full_trail: permissions.can_view_full_audit_trail?
    }, 'Audit trail retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Audit trail error: #{e.message}"
    render_error('Unable to retrieve audit trail.')
  end

  # POST /api/v1/client_profile_management/:id/add_note
  def add_note
    permissions = ClientProfilePermissions.new(current_user, @client)
    
    unless permissions.can_add_service_notes?
      render_error('Insufficient permissions to add service notes.', [], :forbidden)
      return
    end
    
    ClientProfileAuditLog.create!(
      client: @client,
      modified_by: current_user,
      field_name: 'service_note',
      new_value: params[:note],
      change_type: 'create',
      reason: 'Service note added',
      change_category: 'service',
      sensitivity_level: 'low',
      approval_status: 'approved',
      ip_address: request.remote_ip,
      user_agent: request.user_agent
    )
    
    render_success({
      note_added: true,
      timestamp: Time.current.iso8601
    }, 'Service note added successfully')
  rescue StandardError => e
    Rails.logger.error "Add note error: #{e.message}"
    render_error('Unable to add service note.')
  end

  private

  def validate_field(field, value)
    case field.to_s
    when 'phone', 'alt_phone'
      validate_phone(value, field == 'phone')
    when 'email'
      validate_email(value)
    when 'first_name', 'last_name', 'contact_person'
      validate_name(value, field == 'first_name' || field == 'last_name' || field == 'contact_person')
    when 'institution_name'
      validate_institution_name(value)
    when 'household_size', 'population_served'
      validate_positive_number(value)
    when 'plot_number'
      validate_plot_number(value)
    when 'village'
      validate_village(value)
    when 'communication_preference'
      validate_communication_preference(value)
    when 'account_type'
      validate_account_type(value)
    else
      nil
    end
  end

  def validate_phone(phone, required = false)
    return 'Phone number is required' if required && phone.blank?
    return nil if phone.blank? && !required
    
    cleaned = phone.to_s.gsub(/\D/, '')
    
    # STRICT Kenyan phone number patterns - exact digit counts
    valid_patterns = [
      /^254[7]\d{8}$/,   # +254712345678 (exactly 12 digits)
      /^0[7]\d{8}$/,     # 0712345678 (exactly 10 digits)
      /^[7]\d{8}$/       # 712345678 (exactly 9 digits)
    ]
    
    unless valid_patterns.any? { |pattern| pattern.match?(cleaned) }
      'Invalid phone number format. Use Kenyan format: 0729123456 (10 digits), +254729123456 (12 digits), or 729123456 (9 digits)'
    end
  end

  def validate_email(email)
    return nil if email.blank?
    
    # STRICT email validation
    email_regex = /\A[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\z/
    unless email_regex.match?(email)
      'Invalid email format. Use format: user@example.com'
    end
  end

  def validate_name(name, required = false)
    return 'Name is required' if required && name.blank?
    return nil if name.blank? && !required
    
    # STRICT: Only letters, spaces, hyphens, and apostrophes
    name_regex = /\A[a-zA-Z\s'-]+\z/
    if name.length < 2
      'Name must be at least 2 characters long'
    elsif !name_regex.match?(name)
      'Name must contain only letters, spaces, hyphens, and apostrophes. No numbers or symbols allowed'
    end
  end

  def validate_institution_name(name)
    return 'Institution name is required' if name.blank?
    
    # Allow letters, numbers, spaces, and common punctuation for institutions
    institution_regex = /\A[a-zA-Z0-9\s\-'.,&()]+\z/
    if name.length < 2
      'Institution name must be at least 2 characters long'
    elsif !institution_regex.match?(name)
      'Institution name contains invalid characters'
    end
  end

  def validate_positive_number(number)
    return nil if number.blank?
    
    # STRICT: Only positive integers, no decimals
    unless /\A\d+\z/.match?(number.to_s)
      return 'Must contain only numbers (no decimals or other characters)'
    end
    
    num = number.to_i
    if num <= 0
      'Must be a positive number greater than 0'
    end
  end

  def validate_plot_number(plot_number)
    return nil if plot_number.blank?
    
    # Allow alphanumeric plot numbers with common separators
    plot_regex = /\A[a-zA-Z0-9\-\/\s]+\z/
    if plot_number.strip.length < 1
      'Plot number cannot be empty'
    elsif !plot_regex.match?(plot_number)
      'Plot number contains invalid characters. Use letters, numbers, hyphens, and slashes only'
    end
  end

  def validate_village(village)
    return nil if village.blank?
    
    # STRICT: Only letters, spaces, hyphens, apostrophes for village names
    village_regex = /\A[a-zA-Z\s'-]+\z/
    if village.length < 2
      'Village/area name must be at least 2 characters long'
    elsif !village_regex.match?(village)
      'Village/area name must contain only letters, spaces, hyphens, and apostrophes. No numbers allowed'
    end
  end

  def validate_communication_preference(preference)
    return nil if preference.blank?
    
    valid_preferences = ['sms', 'email', 'both']
    unless valid_preferences.include?(preference)
      'Invalid communication preference'
    end
  end

  def validate_account_type(account_type)
    return 'Account type is required' if account_type.blank?
    
    valid_types = ['household', 'institution']
    unless valid_types.include?(account_type)
      'Invalid account type'
    end
  end

  def set_client
    @client = User.client.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Client not found.', [], :not_found)
  end

  def ensure_admin_or_super_admin
    unless current_user&.admin? || current_user&.super_admin?
      render_error('Access denied. Admin privileges required.', [], :forbidden)
    end
  end

  def client_update_params
    # Define allowed parameters based on user role
    allowed_params = []
    permissions = ClientProfilePermissions.new(current_user, @client)
    
    # Contact information
    if permissions.can_edit_contact_info?
      allowed_params += [:phone, :alt_phone, :alt_contact, :email, :landmark, :village]
    end
    
    # Identity information (Super Admin only)
    if permissions.can_edit_identity?
      allowed_params += [:first_name, :last_name, :institution_name, :contact_person, :account_type]
    end
    
    # Service information
    if permissions.can_edit_connection_details?
      allowed_params += [:plot_number, :household_size, :population_served, :storage_capacity]
    end
    
    # Communication preferences
    if permissions.can_edit_communication_preferences?
      allowed_params += [:communication_preference, :newsletter_subscription]
    end
    
    params.require(:client).permit(allowed_params)
  end

  def can_edit_field?(permissions, field)
    case field.to_s
    when 'phone', 'alt_phone', 'alt_contact', 'email', 'landmark', 'village'
      permissions.can_edit_contact_info?
    when 'first_name', 'last_name', 'institution_name', 'contact_person'
      permissions.can_edit_identity?
    when 'account_type'
      permissions.can_edit_account_type?
    when 'plot_number', 'household_size', 'population_served', 'storage_capacity'
      permissions.can_edit_connection_details?
    when 'communication_preference', 'newsletter_subscription'
      permissions.can_edit_communication_preferences?
    else
      false
    end
  end

  def detailed_client_data(client)
    {
      id: client.id,
      phone: client.phone,
      email: client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      full_name: client.full_name,
      display_name: client.display_name,
      account_type: client.account_type,
      role: client.role,
      status: client.status,
      communication_preference: client.communication_preference,
      alt_phone: client.alt_phone,
      plot_number: client.plot_number,
      household_size: client.household_size,
      village: client.village,
      landmark: client.landmark,
      institution_name: client.institution_name,
      institution_type: client.institution_type,
      contact_person: client.contact_person,
      population_served: client.population_served,
      alt_contact: client.alt_contact,
      newsletter_subscription: client.newsletter_subscription,
      created_at: client.created_at,
      updated_at: client.updated_at,
      formatted_created_at: client.created_at.strftime("%B %d, %Y"),
      formatted_updated_at: client.updated_at.strftime("%B %d, %Y at %I:%M %p"),
      account_number: client.user_profile&.account_number,
      profile_completion: calculate_profile_completion(client)
    }
  end

  def audit_log_data(log)
    {
      id: log.id,
      field_name: log.field_name.humanize,
      old_value: log.old_value,
      new_value: log.new_value,
      change_description: log.change_description,
      change_type: log.change_type,
      change_category: log.change_category,
      sensitivity_level: log.sensitivity_level,
      reason: log.reason,
      modified_by: log.modified_by.display_name,
      modified_by_role: log.modified_by.role,
      client_notified: log.client_notified,
      requires_approval: log.requires_approval,
      approval_status: log.approval_status,
      created_at: log.created_at,
      formatted_timestamp: log.formatted_timestamp
    }
  end

  def calculate_profile_completion(client)
    total_fields = 15
    completed_fields = 0
    
    completed_fields += 1 if client.phone.present?
    completed_fields += 1 if client.email.present?
    completed_fields += 1 if client.first_name.present? || client.institution_name.present?
    completed_fields += 1 if client.last_name.present? || client.contact_person.present?
    completed_fields += 1 if client.plot_number.present?
    completed_fields += 1 if client.village.present?
    completed_fields += 1 if client.landmark.present?
    completed_fields += 1 if client.communication_preference.present?
    completed_fields += 1 if client.account_type.present?
    
    if client.household?
      completed_fields += 1 if client.household_size.present?
      completed_fields += 1 if client.alt_phone.present?
    else
      completed_fields += 1 if client.population_served.present?
      completed_fields += 1 if client.alt_contact.present?
    end
    
    ((completed_fields.to_f / total_fields) * 100).round(1)
  end

  def schedule_client_notifications(updated_fields)
    # This would integrate with a background job system
    # For now, we'll just log the notification requirement
    Rails.logger.info "Client notification scheduled for user #{@client.id}, fields: #{updated_fields.join(', ')}"
    
    # In a real implementation, you might do:
    # ClientNotificationJob.perform_later(@client.id, updated_fields, current_user.id)
  end
end