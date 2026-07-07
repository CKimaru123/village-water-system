class Api::V1::Admin::GisController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/gis/layers
  def layers
    type = params[:type] || 'all'
    data = {}

    if type == 'all' || type == 'connections'
      data[:connections] = Connection.where.not(gps_latitude: nil).map { |c|
        { id: c.id, lat: c.gps_latitude, lng: c.gps_longitude, label: c.connection_number,
          status: c.connection_status, zone: c.zone, user: c.user.display_name }
      }
    end

    if type == 'all' || type == 'assets'
      data[:assets] = Asset.with_coordinates.map { |a|
        { id: a.id, lat: a.gps_latitude, lng: a.gps_longitude, label: a.asset_name,
          type: a.asset_type, status: a.status }
      }
    end

    if type == 'all' || type == 'incidents'
      data[:incidents] = Incident.open.where.not(gps_latitude: nil).map { |i|
        { id: i.id, lat: i.gps_latitude, lng: i.gps_longitude, label: i.title,
          type: i.incident_type, severity: i.severity }
      }
    end

    if type == 'all' || type == 'projects'
      data[:projects] = Project.with_coordinates.map { |p|
        { id: p.id, lat: p.gps_latitude, lng: p.gps_longitude, label: p.title, status: p.status }
      }
    end

    render_success({ layers: data }, 'GIS layers retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
