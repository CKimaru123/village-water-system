class Api::V1::Client::DashboardController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_client

  # GET /api/v1/client/dashboard
  def show
    connection = current_user.current_connection
    current_invoice = current_user.current_invoice
    unread_notifications = current_user.notifications.unread.active.count

    render_success({
      account_status: current_user.status,
      display_name: current_user.display_name,
      account_number: current_user.account_number,
      connection: connection ? {
        connection_number: connection.connection_number,
        meter_number: connection.meter_number,
        zone: connection.zone,
        status: connection.connection_status
      } : nil,
      current_bill: current_invoice ? {
        invoice_number: current_invoice.invoice_number,
        total_amount: current_invoice.total_amount,
        due_date: current_invoice.due_date,
        status: current_invoice.status,
        days_overdue: current_invoice.days_overdue
      } : nil,
      unread_notifications: unread_notifications,
      has_overdue_invoices: current_user.has_overdue_invoices?,
      pending_documents: current_user.documents.where(status: 'unverified').count,
      recent_announcements: Announcement.published.for_audience('client').recent.limit(3).map { |a|
        { id: a.id, title: a.title, category: a.category, published_at: a.published_at }
      }
    }, 'Dashboard data retrieved')
  end

  private

  def ensure_client
    render_error('Access denied.', [], :forbidden) unless current_user&.client?
  end
end
