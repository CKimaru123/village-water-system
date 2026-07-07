class Api::V1::PaymentPlansController < ApplicationController
  before_action :authenticate_request

  # GET /api/v1/payment_plans — client sees their own plans
  def index
    plans = if current_user.admin? || current_user.super_admin?
              PaymentPlan.includes(:user, :invoice).recent
            else
              current_user.payment_plans.includes(:invoice).recent
            end
    plans = plans.where(status: params[:status]) if params[:status].present?
    render_success({ payment_plans: plans.map { |p| plan_json(p) } }, 'Payment plans retrieved')
  end

  # POST /api/v1/payment_plans — client requests a plan
  def create
    invoice = current_user.invoices.find_by(id: params[:invoice_id])
    return render_error('Invoice not found', [], :not_found) unless invoice

    plan = PaymentPlan.new(
      user: current_user,
      invoice: invoice,
      total_amount: invoice.total_amount,
      installments_count: params[:installments_count] || 3,
      installment_amount: (invoice.total_amount / (params[:installments_count] || 3).to_f).round(2),
      notes: params[:notes],
      status: 'pending'
    )

    if plan.save
      # Notify admins
      User.where(role: %w[admin super_admin]).find_each do |admin|
        Notification.create!(
          user_id: admin.id, title: 'Payment Plan Request',
          message: "#{current_user.display_name} requested a #{plan.installments_count}-installment plan for invoice #{invoice.invoice_number}.",
          category: 'billing', notification_type: 'payment_plan', priority: 'normal',
          action_url: '/admin/request-queue'
        )
      end
      render_success({ payment_plan: plan_json(plan) }, 'Payment plan requested', :created)
    else
      render_error('Failed to create payment plan', plan.errors.full_messages)
    end
  end

  # PATCH /api/v1/payment_plans/:id/approve — admin approves
  def approve
    authorize_admin!
    return if performed?
    plan = PaymentPlan.find(params[:id])
    plan.approve!(current_user)
    Notification.create!(
      user_id: plan.user_id, title: 'Payment Plan Approved',
      message: "Your #{plan.installments_count}-installment payment plan has been approved. First payment due #{plan.next_due_date.strftime('%b %d, %Y')}.",
      category: 'billing', notification_type: 'payment_plan', priority: 'normal',
      action_url: '/client/payment-plans'
    )
    render_success({ payment_plan: plan_json(plan) }, 'Payment plan approved')
  rescue ActiveRecord::RecordNotFound
    render_error('Payment plan not found', [], :not_found)
  end

  private

  def authorize_admin!
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def plan_json(plan)
    {
      id: plan.id,
      invoice: { id: plan.invoice.id, invoice_number: plan.invoice.invoice_number, total_amount: plan.invoice.total_amount },
      total_amount: plan.total_amount,
      installment_amount: plan.installment_amount,
      installments_count: plan.installments_count,
      installments_paid: plan.installments_paid,
      remaining_installments: plan.remaining_installments,
      remaining_amount: plan.remaining_amount,
      next_due_date: plan.next_due_date,
      status: plan.status,
      notes: plan.notes,
      approved_at: plan.approved_at,
      created_at: plan.created_at
    }
  end
end
