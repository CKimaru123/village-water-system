class Api::V1::Admin::ValvesController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    valves = ValveOperation.recent
    valves = valves.by_zone(params[:zone]) if params[:zone].present?
    valves = valves.where(status: params[:status]) if params[:status].present?
    render_success({ valves: valves.map { |v| valve_json(v) } }, 'Valve operations retrieved')
  end

  def create
    valve = ValveOperation.new(valve_params)
    valve.operated_by = current_user
    valve.operated_at = Time.current
    if valve.save
      if valve.operation_type == 'close'
        CrossDashboardService.on_valve_closed(valve, current_user)
        # Auto-create an announcement so clients are notified in the announcements feed
        Announcement.create!(
          title: "Water Supply Interruption — Zone #{valve.zone}",
          content: "Water supply in zone #{valve.zone} has been temporarily interrupted. Reason: #{valve.reason.presence || 'Scheduled maintenance'}. We apologise for the inconvenience.",
          priority: 'high',
          category: 'service',
          published: true,
          published_at: Time.current,
          created_by_id: current_user.id
        ) rescue nil
      end
      render_success({ valve: valve_json(valve) }, 'Valve operation recorded', :created)
    else
      render_error('Failed to record valve operation', valve.errors.full_messages)
    end
  end

  def update
    valve = ValveOperation.find(params[:id])
    if valve.update(valve_params)
      render_success({ valve: valve_json(valve) }, 'Valve operation updated')
    else
      render_error('Failed to update', valve.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def valve_params
    params.require(:valve).permit(:valve_name, :zone, :operation_type, :status, :scheduled_reopen_at, :reason, :notes)
  end

  def valve_json(v)
    { id: v.id, valve_name: v.valve_name, zone: v.zone, operation_type: v.operation_type,
      status: v.status, operated_at: v.operated_at, scheduled_reopen_at: v.scheduled_reopen_at,
      operated_by: v.operated_by&.display_name, reason: v.reason, created_at: v.created_at }
  end
end
