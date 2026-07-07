class Api::V1::Admin::ScadaController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/scada/readings
  def readings
    readings = ScadaReading.includes(:connection).recent
    readings = readings.by_sensor(params[:sensor_type]) if params[:sensor_type].present?
    readings = readings.where(connection_id: params[:connection_id]) if params[:connection_id].present?
    readings = readings.limit(100)

    render_success({
      readings: readings.map { |r| reading_json(r) },
      anomaly_count: ScadaReading.anomalous.count,
      sensor_types: ScadaReading.distinct.pluck(:sensor_type)
    }, 'SCADA readings retrieved')
  end

  # POST /api/v1/admin/scada/readings
  def create
    reading = ScadaReading.new(reading_params)
    if reading.save
      render_success({ reading: reading_json(reading) }, 'Reading recorded', :created)
    else
      render_error('Failed to record reading', reading.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def reading_params
    params.require(:reading).permit(:connection_id, :sensor_type, :value, :unit, :recorded_at, :status)
  end

  def reading_json(r)
    { id: r.id, sensor_type: r.sensor_type, value: r.value, unit: r.unit,
      status: r.status, recorded_at: r.recorded_at,
      connection_id: r.connection_id }
  end
end
