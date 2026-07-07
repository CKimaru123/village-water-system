class Api::V1::Admin::EnergyController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    records = EnergyRecord.includes(:asset).recent
    records = records.by_type(params[:energy_type]) if params[:energy_type].present?
    records = records.in_period(params[:from], params[:to]) if params[:from].present? && params[:to].present?
    render_success({
      records: records.limit(50).map { |r| energy_json(r) },
      summary: {
        total_cost: EnergyRecord.sum(:cost),
        by_type: EnergyRecord.group(:energy_type).sum(:cost)
      }
    }, 'Energy records retrieved')
  end

  def create
    record = EnergyRecord.new(energy_params)
    record.recorded_by = current_user
    if record.save
      render_success({ record: energy_json(record) }, 'Energy record created', :created)
    else
      render_error('Failed to create record', record.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def energy_params
    params.require(:record).permit(:asset_id, :energy_type, :quantity, :unit, :cost, :record_date, :notes)
  end

  def energy_json(r)
    { id: r.id, energy_type: r.energy_type, quantity: r.quantity, unit: r.unit,
      cost: r.cost, record_date: r.record_date,
      asset: r.asset ? { id: r.asset.id, name: r.asset.asset_name } : nil,
      created_at: r.created_at }
  end
end
