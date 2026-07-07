class Api::V1::Admin::IncidentsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    incidents = Incident.includes(:asset, :reported_by, :assigned_to).recent
    incidents = incidents.where(status: params[:status]) if params[:status].present?
    incidents = incidents.by_type(params[:incident_type]) if params[:incident_type].present?
    render_success({ incidents: incidents.map { |i| incident_json(i) },
                     open_count: Incident.open.count }, 'Incidents retrieved')
  end

  def show
    incident = Incident.find(params[:id])
    render_success({ incident: incident_json(incident, detailed: true) }, 'Incident retrieved')
  end

  def create
    incident = Incident.new(incident_params)
    incident.reported_by = current_user
    if incident.save
      # Notify all admins of critical incidents
      if incident.severity == 'critical'
        User.where(role: ['admin', 'super_admin']).each do |admin|
          Notification.create!(user_id: admin.id, title: 'Critical Incident Reported',
            message: "Critical: #{incident.title}", category: 'incident',
            notification_type: 'incident', priority: 'high', action_url: '/admin/incidents')
        end
      end
      render_success({ incident: incident_json(incident) }, 'Incident created', :created)
    else
      render_error('Failed to create incident', incident.errors.full_messages)
    end
  end

  def update
    incident = Incident.find(params[:id])
    old_status = incident.status
    if incident.update(incident_params)
      incident.update!(resolved_at: Time.current) if incident.status == 'resolved' && old_status != 'resolved'
      render_success({ incident: incident_json(incident) }, 'Incident updated')
    else
      render_error('Failed to update incident', incident.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def incident_params
    params.require(:incident).permit(:title, :description, :incident_type, :severity, :status,
                                     :location, :gps_latitude, :gps_longitude, :asset_id,
                                     :ticket_id, :assigned_to_id, :resolution_notes)
  end

  def incident_json(i, detailed: false)
    data = { id: i.id, title: i.title, incident_type: i.incident_type, severity: i.severity,
             status: i.status, location: i.location, gps_latitude: i.gps_latitude, gps_longitude: i.gps_longitude,
             asset: i.asset ? { id: i.asset.id, name: i.asset.asset_name } : nil,
             reported_by: i.reported_by&.display_name, assigned_to: i.assigned_to&.display_name,
             resolved_at: i.resolved_at, created_at: i.created_at }
    data[:description] = i.description if detailed
    data[:resolution_notes] = i.resolution_notes if detailed
    data
  end
end
