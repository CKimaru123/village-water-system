class Api::V1::ConnectionsController < ApplicationController
  skip_before_action :authenticate_request, only: [] # Require auth for all actions
  before_action :set_connection, only: [:show, :update, :destroy]
  before_action :authorize_admin!, only: [:index, :create, :update, :destroy]

  # GET /api/v1/connections/me - Get current user's connection
  def me
    connection = current_user.connections.first
    
    if connection
      render json: {
        success: true,
        data: {
          connection: connection_json(connection)
        }
      }
    else
      render json: {
        success: false,
        message: 'No connection found for this user'
      }, status: :not_found
    end
  end

  # GET /api/v1/connections - Get all connections (admin only)
  def index
    connections = Connection.includes(:user, :meter_readings)
    
    # Apply filters
    connections = connections.where(connection_status: params[:status]) if params[:status].present?
    connections = connections.where(zone: params[:zone]) if params[:zone].present?
    connections = connections.where(connection_type: params[:connection_type]) if params[:connection_type].present?
    connections = connections.where(user_id: params[:user_id]) if params[:user_id].present?
    
    # Pagination
    page = params[:page] || 1
    per_page = params[:per_page] || 20
    connections = connections.page(page).per(per_page)
    
    render json: {
      success: true,
      data: {
        connections: connections.map { |c| connection_json(c) },
        pagination: {
          current_page: connections.current_page,
          total_pages: connections.total_pages,
          total_count: connections.total_count,
          per_page: per_page
        }
      }
    }
  end

  # GET /api/v1/connections/:id - Get specific connection
  def show
    render json: {
      success: true,
      data: {
        connection: connection_json(@connection, include_readings: true)
      }
    }
  end

  # POST /api/v1/connections - Create new connection (admin only)
  def create
    connection = Connection.new(connection_params)
    
    if connection.save
      CrossDashboardService.on_connection_created(connection, current_user)

      render json: {
        success: true,
        message: 'Connection created successfully',
        data: {
          connection: connection_json(connection)
        }
      }, status: :created
    else
      Rails.logger.error "Connection creation failed: #{connection.errors.full_messages.join(', ')}"
      render json: {
        success: false,
        message: 'Failed to create connection',
        errors: connection.errors.full_messages
      }, status: :unprocessable_entity
    end
  rescue => e
    Rails.logger.error "Connection creation error: #{e.message}\n#{e.backtrace.join("\n")}"
    render json: {
      success: false,
      message: "Server error: #{e.message}",
      errors: [e.message]
    }, status: :internal_server_error
  end

  # PATCH /api/v1/connections/:id - Update connection (admin only)
  def update
    if @connection.update(connection_params)
      # Create notification for the user
      Notification.create(
        user_id: @connection.user_id,
        title: 'Connection Updated',
        message: "Your water connection details have been updated.",
        category: 'service',
        priority: 'normal',
        action_url: '/client/connection'
      )
      
      render json: {
        success: true,
        message: 'Connection updated successfully',
        data: {
          connection: connection_json(@connection)
        }
      }
    else
      render json: {
        success: false,
        message: 'Failed to update connection',
        errors: @connection.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/connections/:id - Deactivate connection (admin only)
  def destroy
    if @connection.update(connection_status: 'inactive')
      render json: {
        success: true,
        message: 'Connection deactivated successfully'
      }
    else
      render json: {
        success: false,
        message: 'Failed to deactivate connection'
      }, status: :unprocessable_entity
    end
  end

  private

  def set_connection
    @connection = if current_user.admin? || current_user.super_admin?
                    Connection.find(params[:id])
                  else
                    current_user.connections.find(params[:id])
                  end
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'Connection not found'
    }, status: :not_found
  end

  def connection_params
    params.require(:connection).permit(
      :user_id,
      :connection_type,
      :zone,
      :connection_date,
      :connection_status,
      :meter_type,
      :meter_installation_date,
      :meter_status,
      :pipe_diameter,
      :water_pressure,
      :supply_schedule,
      :service_line_size,
      :gps_latitude,
      :gps_longitude,
      :installation_notes
    )
  end

  def authorize_admin!
    unless current_user.admin? || current_user.super_admin?
      render json: {
        success: false,
        message: 'Unauthorized access'
      }, status: :forbidden
    end
  end

  def connection_json(connection, include_readings: false)
    data = {
      id: connection.id,
      user_id: connection.user_id,
      user_name: "#{connection.user.first_name} #{connection.user.last_name}",
      account_number: connection.account_number,
      connection_number: connection.connection_number,
      connection_type: connection.connection_type,
      zone: connection.zone,
      connection_date: connection.connection_date,
      connection_status: connection.connection_status,
      
      # Meter information
      meter_number: connection.meter_number,
      meter_type: connection.meter_type,
      meter_installation_date: connection.meter_installation_date,
      meter_status: connection.meter_status,
      
      # Technical specifications
      pipe_diameter: connection.pipe_diameter,
      water_pressure: connection.water_pressure,
      supply_schedule: connection.supply_schedule,
      service_line_size: connection.service_line_size,
      
      # Location
      gps_latitude: connection.gps_latitude,
      gps_longitude: connection.gps_longitude,
      
      # Notes
      installation_notes: connection.installation_notes,
      
      # Timestamps
      created_at: connection.created_at,
      updated_at: connection.updated_at
    }
    
    if include_readings
      last_reading = connection.last_meter_reading
      data[:last_reading] = if last_reading
        {
          reading_value: last_reading.reading_value,
          reading_date: last_reading.reading_date,
          consumption: last_reading.consumption
        }
      else
        nil
      end
      
      data[:recent_readings] = connection.meter_readings.recent.limit(10).map do |reading|
        {
          id: reading.id,
          reading_value: reading.reading_value,
          reading_date: reading.reading_date,
          consumption: reading.consumption,
          reading_type: reading.reading_type
        }
      end
    end
    
    data
  end
end
