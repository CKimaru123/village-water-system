class Api::V1::Admin::CarbonFootprintController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/carbon_footprint/analysis
  def analysis
    carbon_factor = 0.298 # kg CO2 per m3
    period_start  = params[:from] ? Date.parse(params[:from]) : 6.months.ago.to_date
    period_end    = params[:to]   ? Date.parse(params[:to])   : Date.current

    # Total system consumption from meter readings in period
    total_consumption = MeterReading.joins(:connection)
                                    .where(reading_date: period_start..period_end)
                                    .sum(:reading_value)

    # Energy carbon from fuel/electricity records
    energy_cost_total = EnergyRecord.in_period(period_start, period_end).sum(:cost)

    # Monthly breakdown
    monthly = (0...6).map do |i|
      m_start = i.months.ago.beginning_of_month.to_date
      m_end   = i.months.ago.end_of_month.to_date
      consumption = MeterReading.where(reading_date: m_start..m_end).sum(:reading_value)
      { month: m_start.strftime('%b %Y'),
        consumption_m3: consumption,
        carbon_kg: (consumption * carbon_factor).round(2) }
    end.reverse

    render_success({
      period: { from: period_start, to: period_end },
      total_consumption_m3: total_consumption,
      total_carbon_kg: (total_consumption * carbon_factor).round(2),
      total_carbon_tonnes: (total_consumption * carbon_factor / 1000).round(3),
      energy_cost_total: energy_cost_total,
      carbon_factor_per_m3: carbon_factor,
      monthly_breakdown: monthly,
      per_client_average: User.client.count > 0 ? (total_consumption / User.client.count).round(2) : 0
    }, 'Carbon footprint analysis retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
