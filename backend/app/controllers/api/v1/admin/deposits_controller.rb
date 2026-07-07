class Api::V1::Admin::DepositsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/deposits
  def index
    deposits = Deposit.includes(:user, :connection).recent
    deposits = deposits.where(user_id: params[:user_id]) if params[:user_id].present?
    deposits = deposits.where(status: params[:status]) if params[:status].present?
    render_success({ deposits: deposits.map { |d| deposit_json(d) } }, 'Deposits retrieved')
  end

  # POST /api/v1/admin/deposits
  def create
    deposit = Deposit.new(deposit_params)
    deposit.recorded_by = current_user
    if deposit.save
      Notification.create!(
        user_id: deposit.user_id, title: 'Deposit Recorded',
        message: "A deposit of KES #{deposit.amount} (#{deposit.deposit_type}) has been recorded.",
        category: 'billing', notification_type: 'deposit', priority: 'normal',
        action_url: '/client/payment-history'
      )
      render_success({ deposit: deposit_json(deposit) }, 'Deposit recorded', :created)
    else
      render_error('Failed to record deposit', deposit.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/deposits/:id/confirm
  def confirm
    deposit = Deposit.find(params[:id])
    deposit.update!(status: 'confirmed')
    render_success({ deposit: deposit_json(deposit) }, 'Deposit confirmed')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def deposit_params
    params.require(:deposit).permit(:user_id, :connection_id, :deposit_type, :amount, :payment_reference, :notes, :paid_date)
  end

  def deposit_json(d)
    { id: d.id, user: { id: d.user.id, name: d.user.display_name }, deposit_type: d.deposit_type,
      amount: d.amount, status: d.status, payment_reference: d.payment_reference,
      paid_date: d.paid_date, notes: d.notes, created_at: d.created_at }
  end
end
