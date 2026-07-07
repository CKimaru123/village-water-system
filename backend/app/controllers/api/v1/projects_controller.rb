class Api::V1::ProjectsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show]
  before_action :authenticate_request, only: [:create, :update, :destroy]
  before_action :authorize_admin!, only: [:create, :update, :destroy]

  # GET /api/v1/projects
  def index
    projects = Project.all
    projects = projects.ongoing if params[:status] == 'ongoing'
    projects = projects.completed if params[:status] == 'completed'
    projects = projects.with_coordinates if params[:include_coordinates] == 'true'
    projects = projects.recent.limit(params[:limit] || 20)

    render json: { success: true, data: { projects: projects.map { |p| project_json(p, params[:include_coordinates] == 'true') } } }
  end

  # GET /api/v1/projects/:id
  def show
    project = Project.find(params[:id])
    render json: { success: true, data: { project: project_json(project, true) } }
  end

  # POST /api/v1/projects
  def create
    project = Project.new(project_params)
    project.created_by = current_user
    if project.save
      render json: { success: true, message: 'Project created', data: { project: project_json(project) } }, status: :created
    else
      render json: { success: false, errors: project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/projects/:id
  def update
    project = Project.find(params[:id])
    if project.update(project_params)
      render json: { success: true, data: { project: project_json(project) } }
    else
      render json: { success: false, errors: project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/projects/:id
  def destroy
    Project.find(params[:id]).destroy!
    render json: { success: true, message: 'Project deleted' }
  end

  private

  def authorize_admin!
    render json: { success: false, message: 'Unauthorized' }, status: :forbidden unless current_user&.admin? || current_user&.super_admin?
  end

  def project_params
    params.require(:project).permit(:title, :description, :status, :project_type, :location, :start_date, :end_date, :budget, :gps_latitude, :gps_longitude)
  end

  def project_json(p, include_coords = false)
    data = {
      id: p.id, title: p.title, description: p.description,
      status: p.status, project_type: p.project_type,
      location: p.location, start_date: p.start_date,
      end_date: p.end_date, budget: p.budget, created_at: p.created_at
    }
    data[:gps_latitude] = p.gps_latitude if include_coords
    data[:gps_longitude] = p.gps_longitude if include_coords
    data
  end
end
