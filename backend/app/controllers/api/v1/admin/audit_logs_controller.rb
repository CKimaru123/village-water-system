class Api::V1::Admin::AuditLogsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/audit_logs
  def index
    logs = AuditLog.includes(:user).recent

    logs = logs.for_user(params[:user_id])           if params[:user_id].present?
    logs = logs.by_action(params[:action])           if params[:action].present?
    logs = logs.for_resource(params[:resource_type], params[:resource_id]) if params[:resource_type].present?
    logs = logs.in_period(params[:date_from], params[:date_to]) if params[:date_from].present? && params[:date_to].present?

    # Super admin sees all; regular admin sees client-related logs only
    unless current_user.super_admin?
      logs = logs.where.not(action: ['admin_login', 'admin_action'])
    end

    page     = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 30).to_i
    total    = logs.count
    logs     = logs.offset((page - 1) * per_page).limit(per_page)

    render_success({
      audit_logs: logs.map { |l| log_json(l) },
      pagination: { page: page, per_page: per_page, total: total, total_pages: (total.to_f / per_page).ceil }
    }, 'Audit logs retrieved')
  end

  # Also expose client profile audit logs (existing table)
  # GET /api/v1/admin/audit_logs/profile_changes
  def profile_changes
    logs = ClientProfileAuditLog.includes(:client, :modified_by)
                                .order(created_at: :desc)
    logs = logs.where(client_id: params[:user_id]) if params[:user_id].present?
    logs = logs.limit(50)

    render_success({
      profile_changes: logs.map { |l|
        { id: l.id, client: l.client.display_name, field: l.field_name,
          old_value: l.old_value, new_value: l.new_value,
          modified_by: l.modified_by.display_name, change_type: l.change_type,
          created_at: l.created_at }
      }
    }, 'Profile change logs retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def log_json(l)
    { id: l.id, action: l.action,
      user: l.user ? { id: l.user.id, name: l.user.display_name, role: l.user.role } : nil,
      resource_type: l.resource_type, resource_id: l.resource_id,
      details: l.details, ip_address: l.ip_address, performed_at: l.performed_at }
  end
end
