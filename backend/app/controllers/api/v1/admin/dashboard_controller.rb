class Api::V1::Admin::DashboardController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/dashboard
  def show
    render_success({
      stats: {
        total_clients:       User.client.count,
        active_clients:      User.client.active.count,
        suspended_clients:   User.client.suspended.count,
        total_connections:   Connection.count,
        active_connections:  Connection.where(connection_status: 'active').count,
        total_revenue:       Payment.where(status: 'completed').sum(:amount),
        outstanding_balance: Invoice.unpaid.sum(:total_amount),
        overdue_invoices:    Invoice.overdue.count,
        open_tickets:        Ticket.open_tickets.count,
        pending_documents:   Document.where(status: 'unverified').count,
        pending_requests:    StatusRequest.pending.count,
        open_incidents:      Incident.open.count
      },
      recent_activity: {
        latest_payments:    Payment.includes(:user).where(status: 'completed').order(payment_date: :desc).limit(5).map { |p|
          { id: p.id, user: p.user.display_name, amount: p.amount, date: p.payment_date }
        },
        latest_tickets:     Ticket.includes(:user).open_tickets.order(created_at: :desc).limit(5).map { |t|
          { id: t.id, user: t.user.display_name, subject: t.subject, priority: t.priority }
        },
        pending_verifications: Document.where(status: 'unverified').includes(:user).order(created_at: :desc).limit(5).map { |d|
          { id: d.id, user: d.user.display_name, document_type: d.document_type, uploaded_at: d.uploaded_at }
        }
      }
    }, 'Admin dashboard data retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
