class Api::V1::Admin::ContractorsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    contractors = Contractor.all
    contractors = contractors.active if params[:active] == 'true'
    render_success({ contractors: contractors.recent.map { |c| contractor_json(c) } }, 'Contractors retrieved')
  end

  def create
    contractor = Contractor.new(contractor_params)
    contractor.created_by = current_user
    if contractor.save
      render_success({ contractor: contractor_json(contractor) }, 'Contractor created', :created)
    else
      render_error('Failed to create contractor', contractor.errors.full_messages)
    end
  end

  def update
    contractor = Contractor.find(params[:id])
    if contractor.update(contractor_params)
      render_success({ contractor: contractor_json(contractor) }, 'Contractor updated')
    else
      render_error('Failed to update contractor', contractor.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def contractor_params
    params.require(:contractor).permit(:name, :company_name, :phone, :email, :specialization, :status, :notes)
  end

  def contractor_json(c)
    { id: c.id, name: c.name, company_name: c.company_name, phone: c.phone,
      email: c.email, specialization: c.specialization, status: c.status, created_at: c.created_at }
  end
end
