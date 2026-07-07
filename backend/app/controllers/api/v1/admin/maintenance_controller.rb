class Api::V1::Admin::MaintenanceController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/maintenance
  def index
    schedules = MaintenanceSchedule.includes(:asset, :assigned_to).recent
    schedules = schedules.where(status: params[:status]) if params[:status].present?
    schedules = schedules.where(asset_id: params[:asset_id]) if params[:asset_id].present?
    render_success({ schedules: schedules.map { |s| schedule_json(s) },
                     overdue_count: MaintenanceSchedule.overdue.count }, 'Maintenance schedules retrieved')
  end

  # POST /api/v1/admin/maintenance
  def create
    schedule = MaintenanceSchedule.new(schedule_params)
    schedule.created_by = current_user
    if schedule.save
      CrossDashboardService.on_maintenance_scheduled(schedule, current_user)
      render_success({ schedule: schedule_json(schedule) }, 'Maintenance scheduled', :created)
    else
      render_error('Failed to schedule maintenance', schedule.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/maintenance/:id/complete
  def complete
    schedule = MaintenanceSchedule.find(params[:id])
    schedule.update!(status: 'completed', completed_date: Date.current,
                     completion_notes: params[:completion_notes], cost: params[:cost])
    schedule.asset.update!(last_maintenance_date: Date.current)
    render_success({ schedule: schedule_json(schedule) }, 'Maintenance marked complete')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def schedule_params
    params.require(:schedule).permit(:asset_id, :maintenance_type, :scheduled_date, :assigned_to_id, :description, :cost)
  end

  def schedule_json(s)
    { id: s.id, asset: { id: s.asset.id, name: s.asset.asset_name, type: s.asset.asset_type },
      maintenance_type: s.maintenance_type, status: s.status,
      scheduled_date: s.scheduled_date, completed_date: s.completed_date,
      assigned_to: s.assigned_to&.display_name, description: s.description,
      completion_notes: s.completion_notes, cost: s.cost, created_at: s.created_at }
  end
end
