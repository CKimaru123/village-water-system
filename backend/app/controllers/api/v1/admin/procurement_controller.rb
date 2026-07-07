class Api::V1::Admin::ProcurementController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    orders = ProcurementOrder.includes(:approved_by).recent
    orders = orders.where(status: params[:status]) if params[:status].present?
    render_success({ orders: orders.map { |o| order_json(o) } }, 'Procurement orders retrieved')
  end

  def create
    order = ProcurementOrder.new(order_params)
    order.created_by = current_user
    if order.save
      render_success({ order: order_json(order) }, 'Order created', :created)
    else
      render_error('Failed to create order', order.errors.full_messages)
    end
  end

  def approve
    order = ProcurementOrder.find(params[:id])
    unless current_user.super_admin?
      return render_error('Only super admin can approve procurement orders', [], :forbidden)
    end
    order.approve!(current_user)
    render_success({ order: order_json(order) }, 'Order approved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def order_params
    params.require(:order).permit(:supplier_name, :total_amount, :order_date, :expected_delivery, :notes)
  end

  def order_json(o)
    { id: o.id, order_number: o.order_number, supplier_name: o.supplier_name,
      status: o.status, total_amount: o.total_amount, order_date: o.order_date,
      expected_delivery: o.expected_delivery, approved_by: o.approved_by&.display_name,
      approved_at: o.approved_at, created_at: o.created_at }
  end
end
