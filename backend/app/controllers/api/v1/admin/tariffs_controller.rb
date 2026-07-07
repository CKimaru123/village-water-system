class Api::V1::Admin::TariffsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin
  before_action :set_tariff, only: [:show, :update, :destroy]

  # GET /api/v1/admin/tariffs
  def index
    tariffs = TariffRate.all
    tariffs = tariffs.active if params[:active] == 'true'
    tariffs = tariffs.for_account_type(params[:account_type]) if params[:account_type].present?
    render_success({ tariffs: tariffs.order(:account_type, :tier_min_usage).map { |t| tariff_json(t) } }, 'Tariffs retrieved')
  end

  # GET /api/v1/admin/tariffs/:id
  def show
    render_success({ tariff: tariff_json(@tariff) }, 'Tariff retrieved')
  end

  # POST /api/v1/admin/tariffs
  def create
    tariff = TariffRate.new(tariff_params)
    if tariff.save
      render_success({ tariff: tariff_json(tariff) }, 'Tariff created', :created)
    else
      render_error('Failed to create tariff', tariff.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/tariffs/:id
  def update
    if @tariff.update(tariff_params)
      render_success({ tariff: tariff_json(@tariff) }, 'Tariff updated')
    else
      render_error('Failed to update tariff', @tariff.errors.full_messages)
    end
  end

  # DELETE /api/v1/admin/tariffs/:id
  def destroy
    @tariff.update!(is_active: false)
    render_success({}, 'Tariff deactivated')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def set_tariff
    @tariff = TariffRate.find(params[:id])
  end

  def tariff_params
    params.require(:tariff).permit(:rate_name, :account_type, :tier_min_usage, :tier_max_usage,
                                   :rate_per_unit, :fixed_charge, :effective_date, :expiry_date, :is_active)
  end

  def tariff_json(t)
    { id: t.id, rate_name: t.rate_name, account_type: t.account_type, tier_range: t.tier_range,
      tier_min_usage: t.tier_min_usage, tier_max_usage: t.tier_max_usage,
      rate_per_unit: t.rate_per_unit, fixed_charge: t.fixed_charge,
      effective_date: t.effective_date, expiry_date: t.expiry_date, is_active: t.is_active }
  end
end
