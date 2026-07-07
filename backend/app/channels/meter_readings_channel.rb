class MeterReadingsChannel < ApplicationCable::Channel
  # Clients subscribe to their own connection's readings stream
  # Admins can subscribe to all readings (stream: "meter_readings:all")
  # Usage from JS:
  #   consumer.subscriptions.create({ channel: "MeterReadingsChannel" })
  #   consumer.subscriptions.create({ channel: "MeterReadingsChannel", connection_id: 42 })

  def subscribed
    if current_user.admin? || current_user.super_admin?
      stream_from "meter_readings:all"
    else
      connection = current_user.connections.find_by(connection_status: 'active') ||
                   current_user.connections.order(created_at: :desc).first
      if connection
        stream_from "meter_readings:connection_#{connection.id}"
        stream_from "meter_readings:user_#{current_user.id}"
      else
        reject
      end
    end
  end

  def unsubscribed
    stop_all_streams
  end

  # Broadcast a new reading to all relevant subscribers
  # Called from MeterReadingsController and IoT ingestion endpoint
  def self.broadcast_reading(meter_reading)
    payload = reading_payload(meter_reading)

    # Broadcast to connection-specific stream
    ActionCable.server.broadcast(
      "meter_readings:connection_#{meter_reading.connection_id}",
      payload
    )

    # Broadcast to user stream
    ActionCable.server.broadcast(
      "meter_readings:user_#{meter_reading.connection.user_id}",
      payload
    )

    # Broadcast to admin all-readings stream
    ActionCable.server.broadcast("meter_readings:all", payload)
  end

  def self.reading_payload(meter_reading)
    connection = meter_reading.connection
    {
      event: 'new_reading',
      reading: {
        id:            meter_reading.id,
        connection_id: meter_reading.connection_id,
        reading_value: meter_reading.reading_value.to_f,
        reading_date:  meter_reading.reading_date,
        reading_type:  meter_reading.reading_type,
        consumption:   meter_reading.consumption.to_f,
        source_label:  meter_reading.reading_type == 'automatic' ? 'Smart Meter (Automatic)' :
                       "Manual Reading#{meter_reading.recorded_by ? " (#{meter_reading.recorded_by.display_name})" : ''}",
        notes:         meter_reading.notes,
        recorded_at:   meter_reading.created_at,
        meter_type:    connection.meter&.meter_type,
        meter_serial:  connection.meter&.meter_serial,
        user_id:       connection.user_id
      }
    }
  end
end
