# IoT / Smart Meter ingestion endpoint
# Accepts readings from smart meters or SCADA/IoT gateways
# Authentication: hardware token (Bearer token stored on IoT device)
#
# POST /api/v1/iot/readings
# Headers:
#   Authorization: Bearer <hardware_token>
#   Content-Type: application/json
# Body:
#   { meter_serial: "SER260001", reading_value: 1234.56, reading_date: "2026-06-07",
#     timestamp: "2026-06-07T14:30:00Z", device_id: "device-uuid" }
class Api::V1::IotController < ApplicationController
  skip_before_action :authenticate_request  # Uses hardware token auth instead

  before_action :authenticate_hardware_token

  # POST /api/v1/iot/readings — Smart meter pushes a reading
  def create_reading
    meter_serial = params[:meter_serial]
    reading_value = params[:reading_value].to_f
    reading_date  = parse_date(params[:reading_date] || params[:timestamp])

    unless meter_serial.present?
      return render json: { success: false, message: "meter_serial is required" }, status: :unprocessable_entity
    end

    unless reading_value >= 0
      return render json: { success: false, message: "reading_value must be >= 0" }, status: :unprocessable_entity
    end

    meter = Meter.find_by(meter_serial: meter_serial)
    unless meter
      return render json: { success: false, message: "Meter not found: #{meter_serial}" }, status: :not_found
    end

    connection = meter.connection
    unless connection
      return render json: { success: false, message: "No connection associated with this meter" }, status: :unprocessable_entity
    end

    # Check for monotonicity
    last_reading = connection.meter_readings.order(reading_date: :desc).first
    if last_reading && reading_value < last_reading.reading_value
      return render json: {
        success: false,
        message: "Reading value #{reading_value} is less than previous reading #{last_reading.reading_value}. Possible meter tamper or rollover.",
        previous_reading: last_reading.reading_value
      }, status: :unprocessable_entity
    end

    # Check for duplicate (same date already recorded)
    if connection.meter_readings.exists?(reading_date: reading_date.to_date)
      existing = connection.meter_readings.find_by(reading_date: reading_date.to_date)
      # Update if same-day automatic reading (IoT may push multiple times in a day)
      if existing.reading_type == "automatic"
        existing.update!(reading_value: reading_value, notes: "Updated by IoT device #{params[:device_id]}")
        MeterReadingsChannel.broadcast_reading(existing)
        meter.update_columns(last_reading_value: reading_value, last_reading_date: reading_date.to_date)
        return render json: { success: true, message: "Reading updated", data: { reading: reading_json(existing) } }
      end
    end

    reading = connection.meter_readings.create!(
      reading_value: reading_value,
      reading_date:  reading_date.to_date,
      reading_type:  "automatic",
      notes:         "IoT ingestion — device: #{params[:device_id]}",
      recorded_by:   nil
    )

    # Update meter's last reading
    meter.update_columns(last_reading_value: reading_value, last_reading_date: reading_date.to_date)

    # Broadcast real-time update via WebSocket
    MeterReadingsChannel.broadcast_reading(reading)

    # Trigger anomaly detection on unusually high jump
    detect_anomaly(reading, last_reading, connection)

    render json: {
      success: true,
      message: "Reading recorded",
      data: { reading: reading_json(reading) }
    }, status: :created

  rescue ActiveRecord::RecordInvalid => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error "IoT reading error: #{e.message}"
    render json: { success: false, message: "Internal error" }, status: :internal_server_error
  end

  # GET /api/v1/iot/meters/:serial/status — Device polls for its own status
  def meter_status
    meter = Meter.find_by(meter_serial: params[:serial])
    return render json: { success: false, message: "Meter not found" }, status: :not_found unless meter

    schedule = ReadingSchedule.effective_for(meter)

    render json: {
      success: true,
      data: {
        meter_serial:       meter.meter_serial,
        meter_type:         meter.meter_type,
        meter_status:       meter.meter_status,
        last_reading_value: meter.last_reading_value,
        last_reading_date:  meter.last_reading_date,
        reading_schedule:   schedule ? { type: schedule.schedule_type, description: schedule.description } : nil,
        calibration_due:    meter.calibration_due?,
        connection_status:  meter.connection&.connection_status
      }
    }
  end

  private

  def authenticate_hardware_token
    token = request.headers["Authorization"]&.gsub("Bearer ", "")&.strip
    unless token.present? && valid_hardware_token?(token)
      render json: { success: false, message: "Invalid or missing hardware token" }, status: :unauthorized
    end
  end

  # Hardware tokens are stored as a comma-separated ENV variable or in a DB table
  # For production, use a proper IoT device registry table
  def valid_hardware_token?(token)
    allowed = ENV.fetch("IOT_HARDWARE_TOKENS", "iot-dev-token-001,iot-dev-token-002")
               .split(",").map(&:strip)
    allowed.include?(token)
  end

  def parse_date(value)
    return Time.current unless value.present?
    Time.zone.parse(value.to_s) rescue Time.current
  end

  def detect_anomaly(reading, previous, connection)
    return unless previous
    consumption = reading.reading_value - previous.reading_value
    days = [(reading.reading_date - previous.reading_date).to_i, 1].max
    daily_rate = consumption / days.to_f

    # If daily rate is more than 5x the connection's average, flag it
    avg = connection.meter_readings.where("reading_date >= ?", 90.days.ago).limit(30).map(&:average_daily_consumption).reject(&:zero?)
    return if avg.empty?

    avg_daily = avg.sum / avg.size
    return unless avg_daily > 0 && daily_rate > avg_daily * 5

    AnomalyDetection.create!(
      connection_id:   connection.id,
      user_id:         connection.user_id,
      anomaly_type:    "unusual_consumption",
      severity:        daily_rate > avg_daily * 10 ? "high" : "medium",
      description:     "Smart meter detected unusually high consumption: #{daily_rate.round(2)} m³/day vs avg #{avg_daily.round(2)} m³/day",
      detected_value:  daily_rate.round(3),
      expected_value:  avg_daily.round(3),
      status:          "open",
      detected_at:     Time.current,
      affected_zone:   connection.zone
    ) rescue nil
  end

  def reading_json(r)
    {
      id:            r.id,
      connection_id: r.connection_id,
      reading_value: r.reading_value.to_f,
      reading_date:  r.reading_date,
      reading_type:  r.reading_type,
      consumption:   r.consumption.to_f,
      notes:         r.notes,
      created_at:    r.created_at
    }
  end
end
