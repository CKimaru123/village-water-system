class ClientProfilePermissions
  def initialize(user, client)
    @user = user
    @client = client
  end

  # Contact Information Permissions
  def can_edit_contact_info?
    @user.admin? || @user.super_admin?
  end

  def can_edit_phone?
    @user.admin? || @user.super_admin?
  end

  def can_edit_email?
    @user.admin? || @user.super_admin?
  end

  def can_edit_address?
    @user.admin? || @user.super_admin?
  end

  # Identity Information Permissions (Super Admin Only)
  def can_edit_identity?
    @user.super_admin?
  end

  def can_edit_names?
    @user.super_admin?
  end

  def can_edit_account_type?
    @user.super_admin?
  end

  # Service Information Permissions
  def can_edit_connection_details?
    @user.admin? || @user.super_admin?
  end

  def can_edit_billing_info?
    @user.admin? || @user.super_admin?
  end

  def can_edit_service_status?
    @user.admin? || @user.super_admin?
  end

  # Communication Preferences
  def can_edit_communication_preferences?
    @user.admin? || @user.super_admin?
  end

  # Account Management Permissions (Super Admin Only)
  def can_delete_account?
    @user.super_admin?
  end

  def can_create_account?
    @user.admin? || @user.super_admin?
  end

  def can_transfer_ownership?
    @user.super_admin?
  end

  # Security Settings (Super Admin Only)
  def can_edit_security_settings?
    @user.super_admin?
  end

  def can_reset_password?
    @user.super_admin?
  end

  # Audit and Notes
  def can_add_service_notes?
    @user.admin? || @user.super_admin?
  end

  def can_view_audit_trail?
    @user.admin? || @user.super_admin?
  end

  def can_view_full_audit_trail?
    @user.super_admin?
  end

  # Bulk Operations
  def can_bulk_edit?
    @user.super_admin?
  end

  # Emergency Overrides
  def can_emergency_edit?
    @user.super_admin?
  end

  # Get all permissions as hash for frontend
  def to_hash
    {
      contact_info: {
        phone: can_edit_phone?,
        email: can_edit_email?,
        address: can_edit_address?
      },
      identity: {
        names: can_edit_names?,
        account_type: can_edit_account_type?
      },
      service: {
        connection_details: can_edit_connection_details?,
        billing_info: can_edit_billing_info?,
        service_status: can_edit_service_status?
      },
      communication: {
        preferences: can_edit_communication_preferences?
      },
      account_management: {
        delete_account: can_delete_account?,
        create_account: can_create_account?,
        transfer_ownership: can_transfer_ownership?
      },
      security: {
        security_settings: can_edit_security_settings?,
        reset_password: can_reset_password?
      },
      operations: {
        add_service_notes: can_add_service_notes?,
        view_audit_trail: can_view_audit_trail?,
        view_full_audit_trail: can_view_full_audit_trail?,
        bulk_edit: can_bulk_edit?,
        emergency_edit: can_emergency_edit?
      }
    }
  end

  # Get field-level permissions for form rendering
  def field_permissions
    {
      # Green fields - Can edit freely
      green_fields: admin_editable_fields,
      # Yellow fields - Can edit with restrictions/approval
      yellow_fields: restricted_editable_fields,
      # Red fields - Super admin only
      red_fields: super_admin_only_fields,
      # Gray fields - Read-only for all roles
      gray_fields: readonly_fields
    }
  end

  private

  def admin_editable_fields
    fields = []
    fields += ['phone', 'alt_phone', 'email'] if can_edit_contact_info?
    fields += ['landmark', 'village'] if can_edit_address?
    fields += ['communication_preference', 'newsletter_subscription'] if can_edit_communication_preferences?
    fields += ['household_size', 'population_served'] if can_edit_service_status?
    fields
  end

  def restricted_editable_fields
    fields = []
    fields += ['plot_number'] if can_edit_connection_details?
    fields
  end

  def super_admin_only_fields
    fields = []
    fields += ['first_name', 'last_name', 'institution_name', 'contact_person'] if can_edit_identity?
    fields += ['account_type'] if can_edit_account_type?
    fields
  end

  def readonly_fields
    ['id', 'created_at', 'updated_at', 'account_number']
  end
end