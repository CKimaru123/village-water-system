class Api::V1::Admin::GrantsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    grants = Grant.includes(:project).recent
    grants = grants.where(status: params[:status]) if params[:status].present?
    render_success({ grants: grants.map { |g| grant_json(g) } }, 'Grants retrieved')
  end

  def create
    grant = Grant.new(grant_params)
    grant.created_by = current_user
    if grant.save
      render_success({ grant: grant_json(grant) }, 'Grant created', :created)
    else
      render_error('Failed to create grant', grant.errors.full_messages)
    end
  end

  def update
    grant = Grant.find(params[:id])
    if grant.update(grant_params)
      render_success({ grant: grant_json(grant) }, 'Grant updated')
    else
      render_error('Failed to update grant', grant.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def grant_params
    params.require(:grant).permit(:title, :donor_name, :amount, :status, :start_date, :end_date, :project_id, :description)
  end

  def grant_json(g)
    { id: g.id, title: g.title, donor_name: g.donor_name, amount: g.amount,
      status: g.status, start_date: g.start_date, end_date: g.end_date,
      project: g.project ? { id: g.project.id, title: g.project.title } : nil,
      description: g.description, created_at: g.created_at }
  end
end
