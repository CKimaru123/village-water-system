class Api::V1::Admin::SubsidiesController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/subsidies
  def index
    subsidies = Subsidy.includes(:user, :invoice).recent
    subsidies = subsidies.where(status: params[:status]) if params[:status].present?
    render_success({ subsidies: subsidies.map { |s| subsidy_json(s) } }, 'Subsidies retrieved')
  end

  # POST /api/v1/admin/subsidies
  def create
    subsidy = Subsidy.new(subsidy_params)
    if subsidy.save
      render_success({ subsidy: subsidy_json(subsidy) }, 'Subsidy created', :created)
    else
      render_error('Failed to create subsidy', subsidy.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/subsidies/:id/approve
  def approve
    subsidy = Subsidy.find(params[:id])
    subsidy.approve!(current_user, params[:notes])
    CrossDashboardService.on_subsidy_approved(subsidy, current_user)
    render_success({ subsidy: subsidy_json(subsidy) }, 'Subsidy approved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def subsidy_params
    params.require(:subsidy).permit(:user_id, :invoice_id, :subsidy_type, :amount,
                                    :percentage_discount, :reason, :valid_from, :valid_until)
  end

  def subsidy_json(s)
    { id: s.id, user: { id: s.user.id, name: s.user.display_name },
      subsidy_type: s.subsidy_type, amount: s.amount,
      percentage_discount: s.percentage_discount,
      status: s.status, reason: s.reason, valid_from: s.valid_from, valid_until: s.valid_until,
      approved_at: s.approved_at, created_at: s.created_at }
  end
end
