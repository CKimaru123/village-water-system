class Api::V1::Admin::AiController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/ai/anomalies  (2.50)
  def anomalies
    # Detect anomalies: clients whose last 7-day avg consumption is > 3x their 30-day avg
    detected = []
    Connection.where(connection_status: 'active').includes(:user, :meter_readings).each do |conn|
      readings_30 = conn.meter_readings.where('reading_date >= ?', 30.days.ago).order(:reading_date)
      readings_7  = conn.meter_readings.where('reading_date >= ?', 7.days.ago).order(:reading_date)
      next if readings_30.count < 2

      avg_30 = readings_30.map(&:average_daily_consumption).reject(&:zero?)
      next if avg_30.empty?

      baseline = avg_30.sum / avg_30.size
      recent   = readings_7.map(&:average_daily_consumption).reject(&:zero?)
      next if recent.empty?

      recent_avg = recent.sum / recent.size
      next unless recent_avg > baseline * 3

      # Create or find existing anomaly record
      anomaly = AnomalyDetection.find_or_create_by(
        connection_id: conn.id, status: 'open', anomaly_type: 'high_consumption'
      ) do |a|
        a.user          = conn.user
        a.severity      = recent_avg > baseline * 5 ? 'critical' : 'high'
        a.description   = "Consumption #{recent_avg.round(2)} m³/day vs baseline #{baseline.round(2)} m³/day"
        a.detected_value = recent_avg
        a.expected_value = baseline
        a.detected_at   = Time.current
      end

      CrossDashboardService.on_anomaly_detected(anomaly) if anomaly.previously_new_record?

      detected << { connection: conn.connection_number, user: conn.user.display_name,
                    recent_avg_m3: recent_avg.round(2), baseline_m3: baseline.round(2),
                    severity: anomaly.severity, detected_at: anomaly.detected_at }
    end

    stored = AnomalyDetection.open.recent.includes(:user, :connection).limit(50)

    render_success({
      live_detections: detected,
      stored_anomalies: stored.map { |a|
        { id: a.id, type: a.anomaly_type, severity: a.severity,
          description: a.description, detected_value: a.detected_value,
          expected_value: a.expected_value, detected_at: a.detected_at,
          user: a.user&.display_name, connection_id: a.connection_id }
      },
      total_open: AnomalyDetection.open.count
    }, 'Anomaly detection results retrieved')
  end

  # GET /api/v1/admin/ai/maintenance_predictions  (2.51)
  def maintenance_predictions
    predictions = []

    Asset.active.includes(:maintenance_schedules).each do |asset|
      last_maintenance = asset.last_maintenance_date
      next unless last_maintenance

      days_since = (Date.current - last_maintenance).to_i
      # Simple rule: flag assets not maintained in > 90 days
      next unless days_since > 90

      risk = days_since > 180 ? 'high' : days_since > 120 ? 'medium' : 'low'
      predictions << {
        asset_id: asset.id, asset_name: asset.asset_name, asset_type: asset.asset_type,
        last_maintenance: last_maintenance, days_since_maintenance: days_since,
        predicted_risk: risk,
        recommended_action: "Schedule #{asset.asset_type} maintenance within #{risk == 'high' ? '7' : '30'} days"
      }
    end

    predictions.sort_by! { |p| -p[:days_since_maintenance] }

    render_success({
      predictions: predictions,
      high_risk_count:   predictions.count { |p| p[:predicted_risk] == 'high' },
      medium_risk_count: predictions.count { |p| p[:predicted_risk] == 'medium' },
      total_assets_analyzed: Asset.active.count
    }, 'Maintenance predictions retrieved')
  end

  # GET /api/v1/admin/ai/segmentation  (2.52)
  def segmentation
    segments = {
      high_consumers:    [],
      low_consumers:     [],
      overdue_payers:    [],
      at_risk:           [],
      good_standing:     []
    }

    User.client.active.includes(:invoices, :payments, :connections).each do |user|
      conn = user.current_connection
      avg_consumption = if conn
        readings = conn.meter_readings.where('reading_date >= ?', 30.days.ago)
        readings.count >= 2 ? readings.map(&:average_daily_consumption).reject(&:zero?).then { |v| v.empty? ? 0 : v.sum / v.size } : 0
      else
        0
      end

      has_overdue    = user.has_overdue_invoices?
      overdue_amount = user.invoices.overdue.sum(:total_amount)

      if has_overdue && overdue_amount > 5000
        segments[:at_risk] << { id: user.id, name: user.display_name, overdue_amount: overdue_amount }
      elsif has_overdue
        segments[:overdue_payers] << { id: user.id, name: user.display_name, overdue_amount: overdue_amount }
      elsif avg_consumption > 10
        segments[:high_consumers] << { id: user.id, name: user.display_name, avg_daily_m3: avg_consumption.round(2) }
      elsif avg_consumption < 1 && avg_consumption > 0
        segments[:low_consumers] << { id: user.id, name: user.display_name, avg_daily_m3: avg_consumption.round(2) }
      else
        segments[:good_standing] << { id: user.id, name: user.display_name }
      end
    end

    render_success({
      segments: segments,
      counts: segments.transform_values(&:count),
      total_analyzed: User.client.active.count
    }, 'Client segmentation retrieved')
  end

  # PATCH /api/v1/admin/ai/anomalies/:id/resolve
  def resolve_anomaly
    anomaly = AnomalyDetection.find(params[:id])
    anomaly.update!(
      status:           'resolved',
      resolved_at:      Time.current,
      resolved_by_id:   current_user.id,
      resolution_notes: params[:resolution_notes]
    )
    render_success({ anomaly: serialize_anomaly(anomaly) }, 'Anomaly resolved')
  rescue ActiveRecord::RecordNotFound
    render_error('Anomaly not found', [], :not_found)
  end

  # PATCH /api/v1/admin/ai/anomalies/:id/dismiss
  def dismiss_anomaly
    anomaly = AnomalyDetection.find(params[:id])
    anomaly.update!(status: 'dismissed', resolved_at: Time.current, resolved_by_id: current_user.id)
    render_success({ anomaly: serialize_anomaly(anomaly) }, 'Anomaly dismissed')
  rescue ActiveRecord::RecordNotFound
    render_error('Anomaly not found', [], :not_found)
  end

  # GET /api/v1/admin/ai/anomalies/stats
  def anomaly_stats
    render_success({
      total_open:     AnomalyDetection.open.count,
      critical:       AnomalyDetection.critical.count,
      by_type:        AnomalyDetection.group(:anomaly_type).count,
      by_severity:    AnomalyDetection.group(:severity).count,
      by_status:      AnomalyDetection.group(:status).count,
      resolved_today: AnomalyDetection.where('resolved_at >= ?', Date.current.beginning_of_day).count,
      trend_7d:       (0..6).map { |i|
        d = i.days.ago.to_date
        { date: d, count: AnomalyDetection.where('DATE(detected_at) = ?', d).count }
      }.reverse
    }, 'Anomaly stats retrieved')
  end

  # GET /api/v1/admin/ai/segmentation/export
  def segmentation_export
    # Re-run segmentation and return flat list for CSV export
    rows = []
    User.client.active.includes(:invoices, :connections).each do |user|
      conn = user.current_connection
      avg = if conn
        r = conn.meter_readings.where('reading_date >= ?', 30.days.ago)
        r.count >= 2 ? r.map(&:average_daily_consumption).reject(&:zero?).then { |v| v.empty? ? 0 : v.sum / v.size } : 0
      else; 0; end
      overdue = user.invoices.overdue.sum(:total_amount)
      segment = if overdue > 5000 then 'at_risk'
                elsif overdue > 0  then 'overdue_payers'
                elsif avg > 10     then 'high_consumers'
                elsif avg < 1 && avg > 0 then 'low_consumers'
                else 'good_standing'; end
      rows << { id: user.id, name: user.display_name, email: user.email,
                segment: segment, avg_daily_m3: avg.round(2), overdue_amount: overdue.to_f }
    end
    render_success({ rows: rows, total: rows.count }, 'Segmentation export ready')
  end

  private

  def serialize_anomaly(a)
    { id: a.id, anomaly_type: a.anomaly_type, severity: a.severity, status: a.status,
      description: a.description, detected_value: a.detected_value, expected_value: a.expected_value,
      detected_at: a.detected_at, resolved_at: a.resolved_at, resolution_notes: a.resolution_notes,
      affected_zone: a.affected_zone, user: a.user&.display_name, connection_id: a.connection_id }
  end

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
