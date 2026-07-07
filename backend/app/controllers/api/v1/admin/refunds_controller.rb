class Api::V1::Admin::RefundsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/refunds
  def index
    refunds = Refund.includes(:user, :payment).recent
    refunds = refunds.where(status: params[:status]) if params[:status].present?
    render_success({ refunds: refunds.map { |r| refund_json(r) } }, 'Refunds retrieved')
  end

  # POST /api/v1/admin/refunds
  def create
    refund = Refund.new(refund_params)
    if refund.save
      render_success({ refund: refund_json(refund) }, 'Refund request created', :created)
    else
      render_error('Failed to create refund', refund.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/refunds/:id/approve
  def approve
    refund = Refund.find(params[:id])
    refund.approve!(current_user, params[:admin_notes])
    CrossDashboardService.on_refund_approved(refund, current_user)
    render_success({ refund: refund_json(refund) }, 'Refund approved')
  end

  # PATCH /api/v1/admin/refunds/:id/reject
  def reject
    refund = Refund.find(params[:id])
    render_error('Admin notes required when rejecting') and return if params[:admin_notes].blank?
    refund.reject!(current_user, params[:admin_notes])
    render_success({ refund: refund_json(refund) }, 'Refund rejected')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def refund_params
    params.require(:refund).permit(:user_id, :payment_id, :amount, :reason, :refund_method)
  end

  def refund_json(r)
    { id: r.id, user: { id: r.user.id, name: r.user.display_name },
      amount: r.amount, reason: r.reason, status: r.status,
      refund_method: r.refund_method, reference_number: r.reference_number,
      admin_notes: r.admin_notes, reviewed_at: r.reviewed_at, created_at: r.created_at }
  end
end
