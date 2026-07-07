class Api::V1::Admin::CrossDashboardController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/cross_dashboard/summary
  # Returns counts of all pending cross-dashboard items for the admin overview badge/widget
  def summary
    pending_tickets   = Ticket.where(status: %w[open in_progress]).count
    overdue_invoices  = Invoice.overdue.count
    pending_requests  = StatusRequest.pending.count
    sla_breaches      = Ticket.where(status: %w[open in_progress])
                              .where('created_at < ?', 48.hours.ago).count
    pending_refunds   = Refund.where(status: 'pending').count
    anomalies         = AnomalyDetection.open.count rescue 0

    render_success({
      pending_tickets:         pending_tickets,
      overdue_invoices:        overdue_invoices,
      pending_requests:        pending_requests,
      sla_breaches:            sla_breaches,
      pending_refunds:         pending_refunds,
      anomalies:               anomalies,
      # additional detail fields
      pending_documents:       Document.unverified.count,
      pending_appeals:         Appeal.pending.count,
      unmatched_payments:      Payment.where(status: 'unmatched').count,
      total_pending:           pending_tickets + pending_requests + pending_refunds
    }, 'Cross-dashboard summary retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
