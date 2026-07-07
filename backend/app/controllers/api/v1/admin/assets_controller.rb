class Api::V1::Admin::AssetsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin
  before_action :set_asset, only: [:show, :update, :destroy]

  def index
    assets = Asset.all
    assets = assets.by_type(params[:asset_type]) if params[:asset_type].present?
    assets = assets.where(status: params[:status]) if params[:status].present?
    assets = assets.recent
    render_success({ assets: assets.map { |a| asset_json(a) } }, 'Assets retrieved')
  end

  def show
    render_success({ asset: asset_json(@asset, detailed: true) }, 'Asset retrieved')
  end

  def create
    asset = Asset.new(asset_params)
    asset.created_by = current_user
    if asset.save
      render_success({ asset: asset_json(asset) }, 'Asset created', :created)
    else
      render_error('Failed to create asset', asset.errors.full_messages)
    end
  end

  def update
    if @asset.update(asset_params)
      render_success({ asset: asset_json(@asset) }, 'Asset updated')
    else
      render_error('Failed to update asset', @asset.errors.full_messages)
    end
  end

  def destroy
    @asset.update!(status: 'decommissioned')
    render_success({}, 'Asset decommissioned')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def set_asset
    @asset = Asset.find(params[:id])
  end

  def asset_params
    params.require(:asset).permit(:asset_name, :asset_type, :asset_code, :status, :location,
                                  :gps_latitude, :gps_longitude, :installation_date,
                                  :last_maintenance_date, :next_maintenance_date, :notes)
  end

  def asset_json(a, detailed: false)
    data = { id: a.id, asset_name: a.asset_name, asset_type: a.asset_type, asset_code: a.asset_code,
             status: a.status, location: a.location, gps_latitude: a.gps_latitude, gps_longitude: a.gps_longitude,
             installation_date: a.installation_date, last_maintenance_date: a.last_maintenance_date,
             next_maintenance_date: a.next_maintenance_date, created_at: a.created_at }
    data[:notes] = a.notes if detailed
    data[:maintenance_count] = a.maintenance_schedules.count if detailed
    data
  end
end
