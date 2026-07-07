class Api::V1::Admin::DunningController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/dunning/overdue
  def overdue
    invoices = Invoice.overdue.includes(:user, :dunning_actions).order(due_date: :asc)
    render_success({
      overdue_invoices: invoices.map { |i|
        { id: i.id, invoice_number: i.invoice_number, user: { id: i.user.id, name: i.user.display_name, phone: i.user.phone },
          total_amount: i.total_amount, due_date: i.due_date, days_overdue: i.days_overdue,
          reminders_sent: i.dunning_actions.count }
      },
      total_overdue_amount: invoices.sum(:total_amount)
    }, 'Overdue invoices retrieved')
  end

  # POST /api/v1/admin/dunning/send_reminder
  def send_reminder
    invoice = Invoice.find(params[:invoice_id])
    action_type = params[:action_type] || 'reminder'

    dunning = DunningAction.create!(
      invoice: invoice, user: invoice.user,
      action_type: action_type, sent_by: current_user,
      sent_at: Time.current,
      message: params[:message] || "Your invoice #{invoice.invoice_number} of KES #{invoice.total_amount} is overdue by #{invoice.days_overdue} days."
    )

    CrossDashboardService.on_dunning_sent(dunning)

    render_success({ dunning_action: { id: dunning.id, action_type: dunning.action_type, sent_at: dunning.sent_at } }, 'Reminder sent')
  rescue ActiveRecord::RecordNotFound
    render_error('Invoice not found', [], :not_found)
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
