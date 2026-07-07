class Api::V1::MeterReadingsController < ApplicationController
  skip_before_action :authenticate_request, only: [] # Require auth for all actions
  before_action :set_meter_reading, only: [:show, :update, :destroy]
  before_action :authorize_admin!, only: [:create, :update, :destroy]

  # GET /api/v1/meter_readings - Get meter readings
  def index
    if params[:connection_id].present?
      connection = if current_user.admin? || current_user.super_admin?
                    Connection.find(params[:connection_id])
                  else
                    current_user.connections.find(params[:connection_id])
                  end
      
      meter_readings = connection.meter_readings
    elsif current_user.admin? || current_user.super_admin?
      meter_readings = MeterReading.includes(:connection)
    else
      # Get readings for all user's connections
      meter_readings = MeterReading.joins(:connection).where(connections: { user_id: current_user.id })
    end
    
    # Apply filters
    if params[:start_date].present? && params[:end_date].present?
      meter_readings = meter_readings.in_date_range(params[:start_date], params[:end_date])
    end
    
    meter_readings = meter_readings.where(reading_type: params[:reading_type]) if params[:reading_type].present?
    
    # Order by date
    meter_readings = meter_readings.recent
    
    # Pagination
    page = params[:page] || 1
    per_page = params[:per_page] || 50
    meter_readings = meter_readings.page(page).per(per_page)
    
    render json: {
      success: true,
      data: {
        meter_readings: meter_readings.map { |mr| meter_reading_json(mr) },
        pagination: {
          current_page: meter_readings.current_page,
          total_pages: meter_readings.total_pages,
          total_count: meter_readings.total_count,
          per_page: per_page
        }
      }
    }
  end

  # GET /api/v1/meter_readings/:id - Get specific meter reading
  def show
    render json: {
      success: true,
      data: {
        meter_reading: meter_reading_json(@meter_reading)
      }
    }
  end

  # POST /api/v1/meter_readings - Create new meter reading (admin only)
  def create
    meter_reading = MeterReading.new(meter_reading_params)
    meter_reading.recorded_by = current_user

    if meter_reading.save
      CrossDashboardService.on_meter_reading_recorded(meter_reading, current_user)

      # Update meter's last reading values
      meter = meter_reading.connection.meter
      meter&.update_columns(last_reading_value: meter_reading.reading_value, last_reading_date: meter_reading.reading_date)

      # Broadcast real-time update to all subscribers
      MeterReadingsChannel.broadcast_reading(meter_reading)

      render json: {
        success: true,
        message: 'Meter reading recorded successfully',
        data: { meter_reading: meter_reading_json(meter_reading) }
      }, status: :created
    else
      # Surface the monotonicity error clearly so the frontend can display it
      monotonicity_error = meter_reading.errors[:reading_value].find { |e| e.include?('cannot be less than') }
      message = monotonicity_error ? "Invalid reading: #{monotonicity_error}" : 'Failed to record meter reading'

      render json: {
        success: false,
        message: message,
        errors: meter_reading.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/meter_readings/:id - Update meter reading (admin only)
  def update
    if @meter_reading.update(meter_reading_params)
      render json: {
        success: true,
        message: 'Meter reading updated successfully',
        data: {
          meter_reading: meter_reading_json(@meter_reading)
        }
      }
    else
      render json: {
        success: false,
        message: 'Failed to update meter reading',
        errors: @meter_reading.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/meter_readings/:id - Delete meter reading (admin only)
  def destroy
    if @meter_reading.destroy
      render json: {
        success: true,
        message: 'Meter reading deleted successfully'
      }
    else
      render json: {
        success: false,
        message: 'Failed to delete meter reading'
      }, status: :unprocessable_entity
    end
  end

  private

  def set_meter_reading
    @meter_reading = if current_user.admin? || current_user.super_admin?
                      MeterReading.find(params[:id])
                    else
                      MeterReading.joins(:connection).where(connections: { user_id: current_user.id }).find(params[:id])
                    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'Meter reading not found'
    }, status: :not_found
  end

  def meter_reading_params
    params.require(:meter_reading).permit(
      :connection_id,
      :reading_value,
      :reading_date,
      :reading_type,
      :notes
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

  def meter_reading_json(meter_reading)
    {
      id: meter_reading.id,
      connection_id: meter_reading.connection_id,
      connection_number: meter_reading.connection.connection_number,
      meter_number: meter_reading.connection.meter_number,
      reading_value: meter_reading.reading_value,
      reading_date: meter_reading.reading_date,
      reading_type: meter_reading.reading_type,
      consumption: meter_reading.consumption,
      days_since_last_reading: meter_reading.days_since_last_reading,
      average_daily_consumption: meter_reading.average_daily_consumption,
      notes: meter_reading.notes,
      recorded_by: meter_reading.recorded_by ? {
        id: meter_reading.recorded_by.id,
        name: "#{meter_reading.recorded_by.first_name} #{meter_reading.recorded_by.last_name}"
      } : nil,
      created_at: meter_reading.created_at,
      updated_at: meter_reading.updated_at
    }
  end
end
