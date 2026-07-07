class Api::V1::Client::UsageController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_client

  # GET /api/v1/client/usage_overview
  def overview
    connection = current_user.current_connection
    unless connection
      return render_success({
        current_month_m3: 0, last_month_m3: 0, daily_average_m3: 0,
        trend_vs_last_month: 0, has_leak_alert: false, monthly_budget_m3: 0,
        recent_readings: [], connection: nil
      }, 'No active connection found')
    end

    # This month consumption
    this_start = Date.current.beginning_of_month
    this_readings = connection.meter_readings.in_date_range(this_start, Date.current).order(:reading_date)
    current_month = this_readings.count >= 2 ? (this_readings.last.reading_value - this_readings.first.reading_value).round(2) : 0

    # Last month consumption
    last_start = 1.month.ago.beginning_of_month.to_date
    last_end   = 1.month.ago.end_of_month.to_date
    last_readings = connection.meter_readings.in_date_range(last_start, last_end).order(:reading_date)
    last_month = last_readings.count >= 2 ? (last_readings.last.reading_value - last_readings.first.reading_value).round(2) : 0

    # Trend vs last month (%)
    trend = if last_month > 0
              (((current_month - last_month) / last_month.to_f) * 100).round(1)
            else
              0
            end

    # Daily average
    days_elapsed = [Date.current.day, 1].max
    daily_avg = (current_month / days_elapsed).round(2)

    # Leak alert check (current > 3x last month daily avg)
    last_daily = last_month > 0 ? (last_month / 30.0) : 0
    has_leak = last_daily > 0 && daily_avg > (last_daily * 3)

    # Recent readings (last 5)
    recent = connection.meter_readings.recent.limit(5).map { |r|
      { read_at: r.reading_date, reading_value: r.reading_value }
    }

    render_success({
      connection_number: connection.connection_number,
      current_month_m3: current_month,
      last_month_m3: last_month,
      daily_average_m3: daily_avg,
      trend_vs_last_month: trend,
      has_leak_alert: has_leak,
      monthly_budget_m3: 0,
      recent_readings: recent
    }, 'Usage overview retrieved')
  end

  # GET /api/v1/client/consumption_trends
  # Supports: hourly, daily, weekly, monthly, quarterly, semi_annual, annual
  def trends
    connection = current_user.current_connection
    unless connection
      return render_success({ trends: [], message: 'No active connection' }, 'No connection')
    end

    period = params[:period] || 'monthly'

    # Usage zone breakdown — based on connection's tagged zones
    zone_breakdown = build_zone_breakdown(connection)

    trend_data = case period
                 when 'hourly'
                   hourly_trends(connection)
                 when 'daily'
                   daily_trends(connection, 30)
                 when 'weekly'
                   weekly_trends(connection, 12)
                 when 'monthly'
                   monthly_trends(connection, 12)
                 when 'quarterly'
                   quarterly_trends(connection, 8)
                 when 'semi_annual'
                   semi_annual_trends(connection, 6)
                 when 'annual'
                   annual_trends(connection, 5)
                 else
                   monthly_trends(connection, 12)
                 end

    render_success({
      period:         period,
      trends:         trend_data,
      zone_breakdown: zone_breakdown,
      stats: {
        total:   trend_data.sum { |t| t[:consumption_m3] }.round(3),
        average: trend_data.empty? ? 0 : (trend_data.sum { |t| t[:consumption_m3] } / trend_data.size).round(3),
        max:     trend_data.max_by { |t| t[:consumption_m3] },
        min:     trend_data.min_by { |t| t[:consumption_m3] }
      }
    }, 'Consumption trends retrieved')
  end

  # GET /api/v1/client/leak_alerts
  def leak_alerts
    connection = current_user.current_connection
    unless connection
      return render_success({ alerts: [] }, 'No connection')
    end

    # Flag readings where daily consumption is unusually high (> 3x average)
    readings = connection.meter_readings.recent.limit(30)
    avg_daily = readings.map(&:average_daily_consumption).reject(&:zero?).then { |vals| vals.empty? ? 0 : vals.sum / vals.size }
    threshold = avg_daily * 3

    alerts = readings.select { |r| r.average_daily_consumption > threshold && threshold > 0 }.map { |r|
      {
        title: 'Unusual Usage Detected',
        description: "Daily consumption of #{r.average_daily_consumption.round(2)} m³ is #{((r.average_daily_consumption / avg_daily) * 100).round}% above your average.",
        date: r.reading_date,
        detected_at: r.reading_date,
        daily_consumption: r.average_daily_consumption,
        average: avg_daily.round(2),
        severity: 'high',
        status: 'open'
      }
    }

    render_success({ alerts: alerts, average_daily_m3: avg_daily.round(2), threshold_m3: threshold.round(2) }, 'Leak alerts retrieved')
  end

  # GET /api/v1/client/carbon_footprint
  def carbon_footprint
    connection = current_user.current_connection
    carbon_factor = 0.298 # kg CO2 per m3 (standard water treatment factor)

    this_month_consumption = 0
    if connection
      start = Date.current.beginning_of_month
      readings = connection.meter_readings.in_date_range(start, Date.current).order(:reading_date)
      this_month_consumption = readings.count >= 2 ? (readings.last.reading_value - readings.first.reading_value).round(2) : 0
    end

    carbon_kg = (this_month_consumption * carbon_factor).round(2)
    CrossDashboardService.on_carbon_footprint_calculated(current_user, this_month_consumption, carbon_kg)

    render_success({
      this_month_consumption_m3: this_month_consumption,
      consumption_m3: this_month_consumption,
      carbon_kg: carbon_kg,
      carbon_kg_co2: carbon_kg,
      carbon_factor_per_m3: carbon_factor,
      equivalent_trees: (carbon_kg / 21).round(1),
      efficiency_rating: [100 - (this_month_consumption * 2).round, 0].max.clamp(0, 100),
      vs_community_avg: 0,
      tips: ['Fix leaking taps', 'Use water-efficient appliances', 'Harvest rainwater']
    }, 'Carbon footprint calculated')
  end

  private

  def ensure_client
    render_error('Access denied.', [], :forbidden) unless current_user&.client?
  end

  # ─── Consumption trend helpers ────────────────────────────────────────────

  def hourly_trends(connection)
    # Last 24 hours — only smart meters with automatic readings have hourly data
    since = 24.hours.ago
    readings = connection.meter_readings
                         .where("reading_type = 'automatic' AND reading_date >= ?", since.to_date)
                         .order(:reading_date, :created_at)
    bucket_by_hour(readings, since, 24)
  end

  def bucket_by_hour(readings, since, hours)
    buckets = (0...hours).map do |i|
      hour_start = since + i.hours
      { label: hour_start.strftime('%H:00'), hour: hour_start.strftime('%H:00'), consumption_m3: 0.0, readings_count: 0 }
    end
    # Distribute readings into closest hour bucket (approximate for daily readings)
    readings.each_with_index do |r, idx|
      prev = readings[idx - 1] if idx > 0
      next unless prev
      consumption = [r.reading_value - prev.reading_value, 0].max
      hour_idx = ((r.created_at - since) / 3600).to_i.clamp(0, hours - 1)
      buckets[hour_idx][:consumption_m3] = (buckets[hour_idx][:consumption_m3] + consumption).round(3)
      buckets[hour_idx][:readings_count] += 1
    end
    buckets
  end

  def daily_trends(connection, days)
    since = days.days.ago.to_date
    readings = connection.meter_readings
                         .where('reading_date >= ?', since)
                         .order(:reading_date)
    readings_by_date = readings.index_by(&:reading_date)

    (0...days).map do |i|
      date = since + i.days
      r    = readings_by_date[date]
      consumption = r ? r.consumption.to_f : 0
      { label: date.strftime('%d %b'), date: date.iso8601, consumption_m3: consumption.round(3), readings_count: r ? 1 : 0 }
    end
  end

  def weekly_trends(connection, weeks)
    (0...weeks).map do |i|
      week_start = (i * 7).days.ago.beginning_of_week.to_date
      week_end   = week_start + 6.days
      readings   = connection.meter_readings.in_date_range(week_start, week_end).order(:reading_date)
      consumption = readings.count >= 2 ? [readings.last.reading_value - readings.first.reading_value, 0].max.round(3) : 0
      { label: "W#{week_start.cweek} #{week_start.year}", week_start: week_start.iso8601, consumption_m3: consumption, readings_count: readings.count }
    end.reverse
  end

  def monthly_trends(connection, months)
    (0...months).map do |i|
      month_start = i.months.ago.beginning_of_month.to_date
      month_end   = i.months.ago.end_of_month.to_date
      readings    = connection.meter_readings.in_date_range(month_start, month_end).order(:reading_date)
      consumption = readings.count >= 2 ? [readings.last.reading_value - readings.first.reading_value, 0].max.round(3) : 0
      { label: month_start.strftime('%b %Y'), month: month_start.strftime('%Y-%m'), consumption_m3: consumption, readings_count: readings.count }
    end.reverse
  end

  def quarterly_trends(connection, quarters)
    (0...quarters).map do |i|
      quarter_start = (i * 3).months.ago.beginning_of_month.to_date
      quarter_end   = (i * 3 - 2).months.ago.end_of_month.to_date rescue quarter_start + 2.months
      readings      = connection.meter_readings.in_date_range(quarter_start, quarter_end).order(:reading_date)
      consumption   = readings.count >= 2 ? [readings.last.reading_value - readings.first.reading_value, 0].max.round(3) : 0
      quarter_num   = ((quarter_start.month - 1) / 3) + 1
      { label: "Q#{quarter_num} #{quarter_start.year}", quarter_start: quarter_start.iso8601, consumption_m3: consumption, readings_count: readings.count }
    end.reverse
  end

  def semi_annual_trends(connection, periods)
    (0...periods).map do |i|
      start_date = (i * 6).months.ago.beginning_of_month.to_date
      end_date   = (i * 6 - 5).months.ago.end_of_month.to_date rescue start_date + 5.months
      readings   = connection.meter_readings.in_date_range(start_date, end_date).order(:reading_date)
      consumption = readings.count >= 2 ? [readings.last.reading_value - readings.first.reading_value, 0].max.round(3) : 0
      half = start_date.month <= 6 ? "H1" : "H2"
      { label: "#{half} #{start_date.year}", period_start: start_date.iso8601, consumption_m3: consumption, readings_count: readings.count }
    end.reverse
  end

  def annual_trends(connection, years)
    (0...years).map do |i|
      year_start = i.years.ago.beginning_of_year.to_date
      year_end   = i.years.ago.end_of_year.to_date
      readings   = connection.meter_readings.in_date_range(year_start, year_end).order(:reading_date)
      consumption = readings.count >= 2 ? [readings.last.reading_value - readings.first.reading_value, 0].max.round(3) : 0
      { label: year_start.year.to_s, year: year_start.year, consumption_m3: consumption, readings_count: readings.count }
    end.reverse
  end

  # Build usage zone breakdown from connection's usage_zones field and readings
  # usage_zones is a comma-separated string like "kitchen,bathroom,outdoor"
  # Distribution is estimated when real sub-meter data isn't available
  ZONE_DEFAULTS = {
    "kitchen"  => { label: "Kitchen & Drinking", share: 0.30, color: "#2196f3" },
    "bathroom" => { label: "Bathroom & Hygiene", share: 0.25, color: "#4cceac" },
    "laundry"  => { label: "Laundry",            share: 0.20, color: "#db4f4a" },
    "outdoor"  => { label: "Outdoor & Garden",   share: 0.15, color: "#f0c040" },
    "other"    => { label: "Other",              share: 0.10, color: "#888" }
  }.freeze

  def build_zone_breakdown(connection)
    zones = (connection.usage_zones.presence || "kitchen,bathroom,laundry,outdoor,other").split(",").map(&:strip)
    total_count = zones.size.to_f

    # Normalize shares so they add up to 100%
    raw = zones.map { |z| ZONE_DEFAULTS[z] || { label: z.capitalize, share: 1.0 / total_count, color: "#888" } }
    total_share = raw.sum { |z| z[:share] }

    raw.map do |z|
      percentage = ((z[:share] / total_share) * 100).round(1)
      { name: z[:label], value: percentage, color: z[:color], zone_key: zones[raw.index(z)] }
    end
  end
end
