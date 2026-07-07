class Api::V1::Admin::BillingConfigsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/billing_configs
  # Returns global default + all per-client configs
  def index
    global  = BillingConfig.global_default.first
    clients = BillingConfig.where.not(user_id: nil).includes(:user, :tariff).order(:user_id)

    render_success({
      global_default: global ? config_json(global) : nil,
      client_configs: clients.map { |c| config_json(c) }
    }, 'Billing configs retrieved')
  end

  # GET /api/v1/admin/billing_configs/global
  def show_global
    config = BillingConfig.global_default.first
    if config
      render_success({ billing_config: config_json(config) }, 'Global billing config retrieved')
    else
      render_success({ billing_config: nil }, 'No global billing config set')
    end
  end

  # PATCH /api/v1/admin/billing_configs/global
  def update_global
    config = BillingConfig.global_default.first

    if config
      if config.update(config_params)
        render_success({ billing_config: config_json(config) }, 'Global billing config updated')
      else
        render_error('Failed to update global billing config', config.errors.full_messages)
      end
    else
      config = BillingConfig.new(config_params.merge(user_id: nil, created_by_id: current_user.id))
      if config.save
        render_success({ billing_config: config_json(config) }, 'Global billing config created', :created)
      else
        render_error('Failed to create global billing config', config.errors.full_messages)
      end
    end
  end

  # GET /api/v1/admin/billing_configs/:user_id
  def show
    config = BillingConfig.for_user(params[:user_id]).first
    if config
      render_success({ billing_config: config_json(config) }, 'Client billing config retrieved')
    else
      render_success({ billing_config: nil }, 'No individual billing config for this client')
    end
  end

  # PATCH /api/v1/admin/billing_configs/:user_id
  def update
    user   = User.find(params[:user_id])
    config = BillingConfig.for_user(user.id).first

    if config
      if config.update(config_params)
        render_success({ billing_config: config_json(config) }, 'Client billing config updated')
      else
        render_error('Failed to update client billing config', config.errors.full_messages)
      end
    else
      config = BillingConfig.new(config_params.merge(user_id: user.id, created_by_id: current_user.id))
      if config.save
        render_success({ billing_config: config_json(config) }, 'Client billing config created', :created)
      else
        render_error('Failed to create client billing config', config.errors.full_messages)
      end
    end
  rescue ActiveRecord::RecordNotFound
    render_error('Client not found', [], :not_found)
  end

  # DELETE /api/v1/admin/billing_configs/:user_id
  # Removes per-client config — client reverts to global default
  def destroy
    config = BillingConfig.for_user(params[:user_id]).first
    if config
      config.destroy
      render_success({}, 'Client billing config removed — client will use global default')
    else
      render_error('No individual billing config found for this client', [], :not_found)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def config_params
    params.require(:billing_config).permit(:billing_mode, :fixed_amount, :tariff_id, :effective_from)
  end

  def config_json(c)
    {
      id:             c.id,
      user_id:        c.user_id,
      user_name:      c.user ? c.user.display_name : nil,
      billing_mode:   c.billing_mode,
      fixed_amount:   c.fixed_amount,
      tariff_id:      c.tariff_id,
      tariff_name:    c.tariff ? c.tariff.rate_name : nil,
      effective_from: c.effective_from,
      global:         c.global?,
      created_at:     c.created_at,
      updated_at:     c.updated_at
    }
  end
end
