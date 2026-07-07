class Api::V1::Admin::VolunteersController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    volunteers = Volunteer.all
    volunteers = volunteers.active if params[:active] == 'true'
    render_success({ volunteers: volunteers.recent.map { |v| volunteer_json(v) } }, 'Volunteers retrieved')
  end

  def create
    volunteer = Volunteer.new(volunteer_params)
    volunteer.created_by = current_user
    if volunteer.save
      render_success({ volunteer: volunteer_json(volunteer) }, 'Volunteer created', :created)
    else
      render_error('Failed to create volunteer', volunteer.errors.full_messages)
    end
  end

  def update
    volunteer = Volunteer.find(params[:id])
    if volunteer.update(volunteer_params)
      render_success({ volunteer: volunteer_json(volunteer) }, 'Volunteer updated')
    else
      render_error('Failed to update volunteer', volunteer.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def volunteer_params
    params.require(:volunteer).permit(:user_id, :name, :phone, :email, :skills, :status)
  end

  def volunteer_json(v)
    { id: v.id, name: v.name, phone: v.phone, email: v.email,
      skills: v.skills, status: v.status, created_at: v.created_at }
  end
end
