class Api::V1::Admin::ReconciliationController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/reconciliation/unmatched
  def unmatched
    unmatched_payments = Payment.where(status: 'completed')
                                .where.not(id: ReconciliationRecord.select(:payment_id))
                                .includes(:user, :invoice).recent
    render_success({
      unmatched_payments: unmatched_payments.map { |p|
        { id: p.id, user: { id: p.user.id, name: p.user.display_name },
          amount: p.amount, payment_method: p.payment_method,
          transaction_reference: p.transaction_reference, payment_date: p.payment_date,
          invoice: p.invoice ? { id: p.invoice.id, invoice_number: p.invoice.invoice_number, total_amount: p.invoice.total_amount } : nil }
      },
      total_unmatched: unmatched_payments.count
    }, 'Unmatched payments retrieved')
  end

  # POST /api/v1/admin/reconciliation/match
  def match
    payment = Payment.find(params[:payment_id])
    invoice = Invoice.find_by(id: params[:invoice_id])

    discrepancy = invoice ? (payment.amount - invoice.total_amount).abs : 0

    record = ReconciliationRecord.create!(
      payment: payment, invoice: invoice,
      status: discrepancy < 1 ? 'matched' : 'partial',
      payment_amount: payment.amount,
      invoice_amount: invoice&.total_amount,
      discrepancy: discrepancy,
      reconciled_by: current_user,
      reconciled_at: Time.current,
      notes: params[:notes]
    )

    invoice&.mark_as_paid! if discrepancy < 1

    render_success({ record: { id: record.id, status: record.status, discrepancy: record.discrepancy } }, 'Payment matched')
  rescue ActiveRecord::RecordNotFound => e
    render_error(e.message, [], :not_found)
  end

  # GET /api/v1/admin/reconciliation/summary
  def summary
    render_success({
      total_payments:    Payment.where(status: 'completed').count,
      total_matched:     ReconciliationRecord.matched.count,
      total_unmatched:   Payment.where(status: 'completed').where.not(id: ReconciliationRecord.select(:payment_id)).count,
      total_collected:   Payment.where(status: 'completed').sum(:amount),
      total_outstanding: Invoice.unpaid.sum(:total_amount)
    }, 'Reconciliation summary retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
