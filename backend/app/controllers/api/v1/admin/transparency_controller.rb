class Api::V1::Admin::TransparencyController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/transparency/metrics
  def metrics
    render_success({
      water_quality: KnowledgeBaseArticle.published.by_category('water_quality').count,
      uptime_percentage: calculate_uptime,
      financial: {
        collection_rate: collection_rate,
        total_clients: User.client.count,
        active_connections: Connection.where(connection_status: 'active').count
      },
      projects: {
        ongoing: Project.ongoing.count,
        completed: Project.completed.count
      },
      incidents: {
        open: Incident.open.count,
        resolved_this_month: Incident.resolved.where(resolved_at: Date.current.beginning_of_month..).count
      }
    }, 'Transparency metrics retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def calculate_uptime
    total = Incident.where(created_at: 30.days.ago..).count
    outages = Incident.where(created_at: 30.days.ago.., incident_type: 'outage').count
    return 100.0 if total.zero?
    ((1 - (outages.to_f / (30 * 24))) * 100).round(1).clamp(0, 100)
  end

  def collection_rate
    invoiced = Invoice.sum(:total_amount).to_f
    return 0 if invoiced.zero?
    ((Payment.where(status: 'completed').sum(:amount) / invoiced) * 100).round(1)
  end
end
