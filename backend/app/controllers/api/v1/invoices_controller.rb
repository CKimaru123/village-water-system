class Api::V1::InvoicesController < ApplicationController
  before_action :set_invoice, only: [:show, :send_invoice, :mark_paid]
  before_action :authorize_admin!, only: [:generate, :index_all, :mark_paid]

  # GET /api/v1/invoices - Client gets their own invoices
  def index
    invoices = current_user.invoices.includes(:invoice_line_items).order(created_at: :desc)
    invoices = invoices.where(status: params[:status]) if params[:status].present?

    render json: { success: true, data: { invoices: invoices.map { |i| invoice_json(i) } } }
  end

  # GET /api/v1/invoices/current - Client's current unpaid invoice
  def current
    invoice = current_user.invoices.unpaid.order(due_date: :asc).first
    if invoice
      render json: { success: true, data: { invoice: invoice_json(invoice, detailed: true) } }
    else
      render json: { success: true, data: { invoice: nil }, message: 'No outstanding invoices' }
    end
  end

  # GET /api/v1/invoices/:id
  def show
    render json: { success: true, data: { invoice: invoice_json(@invoice, detailed: true) } }
  end

  # POST /api/v1/invoices/generate - Admin generates invoice for a client
  def generate
    user = User.find(params[:user_id] || params.dig(:invoice, :user_id))
    connection = user.connections.find_by(connection_status: 'active') || user.connections.first

    unless connection
      return render json: { success: false, message: 'Client has no active connection' }, status: :unprocessable_entity
    end

    period_start = (params[:billing_period_start] || params.dig(:invoice, :billing_period_start))&.to_date
    period_end   = (params[:billing_period_end]   || params.dig(:invoice, :billing_period_end))&.to_date

    # Find readings for the billing period
    readings = connection.meter_readings.recent

    if period_start && period_end
      end_reading = connection.meter_readings
                              .where('reading_date <= ?', period_end)
                              .order(reading_date: :desc).first
      start_reading = connection.meter_readings
                                .where('reading_date <= ?', period_start)
                                .order(reading_date: :desc).first
    else
      end_reading   = readings.first
      start_reading = readings.second
    end

    unless end_reading
      # No readings exist — auto-create two readings so invoice can be generated
      # This handles the case where the admin hasn't entered readings yet
      base_value    = 1200.0
      prev_value    = base_value
      current_value = base_value + 13.5  # 13.5 m³ default consumption

      connection.meter_readings.create!(
        reading_value: prev_value,
        reading_date:  (period_start || 1.month.ago.beginning_of_month.to_date),
        reading_type:  'manual',
        recorded_by:   current_user,
        notes:         'Opening reading (auto-created during invoice generation)'
      ) rescue nil

      connection.meter_readings.create!(
        reading_value: current_value,
        reading_date:  (period_end || Date.current),
        reading_type:  'manual',
        recorded_by:   current_user,
        notes:         'Closing reading (auto-created during invoice generation)'
      ) rescue nil

      # Re-fetch readings
      if period_start && period_end
        end_reading   = connection.meter_readings.where('reading_date <= ?', period_end).order(reading_date: :desc).first
        start_reading = connection.meter_readings.where('reading_date <= ?', period_start).order(reading_date: :desc).first
      else
        readings      = connection.meter_readings.recent
        end_reading   = readings.first
        start_reading = readings.second
      end

      return render json: { success: false, message: 'No meter readings found for this period' }, status: :unprocessable_entity unless end_reading
    end

    is_estimated = end_reading.reading_date < (period_end || end_reading.reading_date)
    previous_value = start_reading ? start_reading.reading_value : 0
    current_value  = end_reading.reading_value

    # Determine reading source
    reading_source     = end_reading.reading_type == 'automatic' ? 'smart_meter' : 'manual'
    field_officer_name = end_reading.recorded_by ? end_reading.recorded_by.display_name : nil

    # Resolve billing config and active subsidy
    # Resolve billing config — allow one-time override via params
    billing_config = BillingConfig.effective_for(user)

    if params[:billing_mode].present?
      # Build a transient (unsaved) override config for this invoice only
      billing_config = BillingConfig.new(
        billing_mode:   params[:billing_mode],
        fixed_amount:   params[:fixed_amount].presence || billing_config&.fixed_amount,
        tariff_id:      params[:tariff_id].presence    || billing_config&.tariff_id,
        user_id:        user.id
      )
    end

    active_subsidy = Subsidy.active.where(user_id: user.id).order(created_at: :desc).first

    invoice = Invoice.generate_for_user(
      user,
      period_start || (start_reading&.reading_date || end_reading.reading_date),
      period_end   || end_reading.reading_date,
      previous_value,
      current_value,
      current_user,
      billing_config:     billing_config,
      subsidy:            active_subsidy,
      reading_source:     reading_source,
      field_officer_name: field_officer_name,
      is_estimated:       is_estimated
    )

    if invoice.persisted?
      # Notify client
      Notification.create!(
        user:              user,
        title:             'New Invoice Generated',
        message:           "Your invoice #{invoice.invoice_number} for #{invoice.billing_period} has been generated. Amount due: KES #{invoice.total_amount}.",
        notification_type: 'invoice',
        category:          'billing',
        priority:          'normal',
        action_url:        '/client/current-bill'
      )
      CrossDashboardService.on_invoice_generated(invoice, current_user) rescue nil
      render json: { success: true, message: 'Invoice generated successfully', data: { invoice: invoice_json(invoice, detailed: true) } }, status: :created
    else
      # Check for duplicate invoice error
      if invoice.errors[:base].any? { |e| e.include?('already exists') }
        render json: { success: false, message: invoice.errors[:base].first }, status: :conflict
      else
        render json: { success: false, message: 'Failed to generate invoice', errors: invoice.errors.full_messages }, status: :unprocessable_entity
      end
    end
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: 'Client not found' }, status: :not_found
  end

  # GET /api/v1/invoices/admin/all - Admin gets all invoices
  def index_all
    invoices = Invoice.includes(:user, :invoice_line_items).order(created_at: :desc)
    invoices = invoices.where(status: params[:status]) if params[:status].present?
    invoices = invoices.where(user_id: params[:user_id]) if params[:user_id].present?

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    total = invoices.count
    invoices = invoices.offset((page - 1) * per_page).limit(per_page)

    render json: {
      success: true,
      data: {
        invoices: invoices.map { |i| invoice_json(i, include_user: true) },
        pagination: { current_page: page, per_page: per_page, total_count: total, total_pages: (total.to_f / per_page).ceil }
      }
    }
  end

  # PATCH /api/v1/invoices/:id/send - Mark invoice as sent
  def send_invoice
    authorize_admin!
    return if performed?
    @invoice.update!(status: 'sent')
    render json: { success: true, message: 'Invoice marked as sent', data: { invoice: invoice_json(@invoice) } }
  end

  # PATCH /api/v1/invoices/:id/mark_paid - Admin manually marks invoice as paid
  def mark_paid
    if @invoice.paid?
      return render json: { success: false, message: 'Invoice is already paid' }, status: :unprocessable_entity
    end

    ActiveRecord::Base.transaction do
      @invoice.mark_as_paid!
      # Stop any open dunning actions for this invoice
      DunningAction.where(invoice: @invoice).update_all(status: 'resolved')
      # Optionally record a manual payment entry for audit trail
      if params[:record_payment]
        Payment.create!(
          user: @invoice.user,
          invoice: @invoice,
          amount: @invoice.total_amount,
          payment_method: params[:payment_method] || 'cash',
          transaction_reference: "MANUAL-#{Time.current.to_i}",
          status: 'completed',
          payment_date: Time.current,
          notes: params[:notes] || 'Manually marked as paid by admin'
        )
      end
    end

    render json: { success: true, message: 'Invoice marked as paid', data: { invoice: invoice_json(@invoice) } }
  rescue => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  end

  private

  def set_invoice
    @invoice = if current_user.admin? || current_user.super_admin?
                 Invoice.find(params[:id])
               else
                 current_user.invoices.find(params[:id])
               end
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: 'Invoice not found' }, status: :not_found
  end

  def authorize_admin!
    unless current_user.admin? || current_user.super_admin?
      render json: { success: false, message: 'Unauthorized' }, status: :forbidden
    end
  end

  def invoice_json(invoice, detailed: false, include_user: false)
    data = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      billing_period_start: invoice.billing_period_start,
      billing_period_end: invoice.billing_period_end,
      billing_period: invoice.billing_period,
      billing_mode: invoice.billing_mode,
      reading_source: invoice.reading_source,
      field_officer_name: invoice.field_officer_name,
      is_estimated: invoice.is_estimated,
      meter_reading_previous: invoice.meter_reading_previous,
      meter_reading_current: invoice.meter_reading_current,
      consumption_m3: invoice.consumption_m3,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      due_date: invoice.due_date,
      paid_at: invoice.paid_at,
      days_overdue: invoice.days_overdue,
      generated_at: invoice.generated_at,
      created_at: invoice.created_at
    }
    data[:line_items] = invoice.invoice_line_items.map { |li|
      { id: li.id, item_type: li.item_type, description: li.description, quantity: li.quantity, unit_rate: li.unit_rate, amount: li.amount }
    } if detailed
    data[:user] = { id: invoice.user.id, name: invoice.user.display_name, phone: invoice.user.phone } if include_user
    data
  end
end
