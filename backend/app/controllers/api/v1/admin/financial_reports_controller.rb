class Api::V1::Admin::FinancialReportsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/financial_reports
  def index
    period = params[:period] || 'monthly'
    months_back = period == 'yearly' ? 12 : 6

    monthly = (0...months_back).map do |i|
      start_date = i.months.ago.beginning_of_month
      end_date   = i.months.ago.end_of_month
      invoices   = Invoice.where(billing_period_start: start_date..end_date)
      payments   = Payment.where(status: 'completed', payment_date: start_date..end_date)
      { month: start_date.strftime('%b %Y'),
        invoiced: invoices.sum(:total_amount),
        collected: payments.sum(:amount),
        invoice_count: invoices.count,
        payment_count: payments.count }
    end.reverse

    render_success({
      period: period,
      summary: {
        total_invoiced:    Invoice.sum(:total_amount),
        total_collected:   Payment.where(status: 'completed').sum(:amount),
        total_outstanding: Invoice.unpaid.sum(:total_amount),
        collection_rate:   collection_rate
      },
      monthly_breakdown: monthly,
      overdue_summary: {
        count:  Invoice.overdue.count,
        amount: Invoice.overdue.sum(:total_amount)
      }
    }, 'Financial report retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def collection_rate
    total_invoiced = Invoice.sum(:total_amount).to_f
    return 0 if total_invoiced.zero?
    ((Payment.where(status: 'completed').sum(:amount) / total_invoiced) * 100).round(1)
  end
end
