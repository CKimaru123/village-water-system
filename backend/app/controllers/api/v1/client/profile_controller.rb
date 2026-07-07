class Api::V1::Client::ProfileController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_client

  # GET /api/v1/client/profile/audit_trail
  def audit_trail
    # Clients can only view their own audit trail
    @audit_logs = ClientProfileAuditLog.for_client(current_user.id).recent.limit(50)
    
    # Filter out high sensitivity information for clients
    @audit_logs = @audit_logs.where.not(sensitivity_level: 'high')
    
    render_success({
      audit_logs: @audit_logs.map { |log| audit_log_data(log) },
      can_view_full_trail: false
    }, 'Audit trail retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Client audit trail error: #{e.message}"
    render_error('Unable to retrieve audit trail.')
  end

  private

  def ensure_client
    unless current_user&.client?
      render_error('Access denied. Client access required.', [], :forbidden)
    end
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
end