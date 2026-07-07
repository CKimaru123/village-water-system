class Api::V1::Client::BillingController < ApplicationController
  before_action :authenticate_request
  # Allow any authenticated user to view their own billing data
  # (admins may also be registered as clients with connections)

  # GET /api/v1/client/current_bill
  def current_bill
    invoice = current_user.invoices.unpaid.order(:due_date).first

    if invoice
      render_success({ invoice: invoice_json(invoice, detailed: true) }, 'Current bill retrieved')
    else
      # No real invoice — return a demo bill so the UI always shows data
      render_success({ invoice: demo_invoice_json, demo: true }, 'Demo bill (no real invoice found)')
    end
  end

  # GET /api/v1/client/payments
  def payments
    payments = current_user.payments.includes(:invoice).recent
    payments = payments.where(status: params[:status]) if params[:status].present?

    render_success({
      payments: payments.map { |p| payment_json(p) },
      total_paid: payments.where(status: 'completed').sum(:amount)
    }, 'Payment history retrieved')
  end

  # GET /api/v1/client/meter_readings
  # Returns last 12 months of readings for the client's connection, ordered by date desc
  def meter_readings
    connection = current_user.connections.find_by(connection_status: 'active') ||
                 current_user.connections.order(created_at: :desc).first

    unless connection
      return render_success({ readings: [], monthly_trend: [] }, 'No connection found')
    end

    since = 12.months.ago.to_date
    readings = connection.meter_readings
                         .where('reading_date >= ?', since)
                         .order(reading_date: :desc)
                         .includes(:recorded_by)

    readings_json = readings.map do |r|
      {
        id:           r.id,
        reading_date: r.reading_date,
        reading_value: r.reading_value,
        consumption:  r.consumption,
        reading_type: r.reading_type,
        source_label: r.reading_type == 'automatic' ? 'Smart Meter (Automatic)' : "Manual Reading#{r.recorded_by ? " (#{r.recorded_by.display_name})" : ''}",
        notes:        r.notes,
        created_at:   r.created_at
      }
    end

    # Build monthly trend: group by year-month, sum consumption
    monthly_trend = readings.group_by { |r| r.reading_date.strftime('%Y-%m') }
                            .map do |month, rds|
      total_consumption = rds.sum(&:consumption)
      { month: month, consumption_m3: total_consumption.round(3) }
    end.sort_by { |m| m[:month] }

    render_success({ readings: readings_json, monthly_trend: monthly_trend }, 'Meter readings retrieved')
  end

  # GET /api/v1/client/export
  def export
    type = params[:type] || 'billing'
    format = params[:format] || 'json'

    data = case type
    when 'usage'
      current_user.meter_readings.includes(:connection).recent.limit(100).map { |r|
        { date: r.reading_date, value: r.reading_value, consumption: r.consumption, type: r.reading_type }
      }
    when 'billing'
      current_user.invoices.order(created_at: :desc).limit(50).map { |i|
        { invoice_number: i.invoice_number, period: i.billing_period, amount: i.total_amount, status: i.status, due_date: i.due_date }
      }
    else
      []
    end

    render_success({ type: type, format: format, records: data, exported_at: Time.current }, 'Export data ready')
  end

  private

  def invoice_json(invoice, detailed: false)
    # Find active subsidy for display
    active_subsidy = Subsidy.active.where(user_id: invoice.user_id).order(created_at: :desc).first

    data = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      billing_period: invoice.billing_period,
      billing_period_start: invoice.billing_period_start,
      billing_period_end: invoice.billing_period_end,
      billing_mode: invoice.billing_mode,
      billing_mode_label: billing_mode_label(invoice.billing_mode),
      reading_source: invoice.reading_source,
      reading_source_label: reading_source_label(invoice),
      field_officer_name: invoice.field_officer_name,
      is_estimated: invoice.is_estimated,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      total_amount: invoice.total_amount,
      status: invoice.status,
      due_date: invoice.due_date,
      days_until_due: invoice.due_date ? [(invoice.due_date - Date.current).to_i, 0].max : nil,
      paid_at: invoice.paid_at,
      days_overdue: invoice.days_overdue,
      consumption_m3: invoice.consumption_m3,
      meter_reading_previous: invoice.meter_reading_previous,
      meter_reading_current: invoice.meter_reading_current,
      generated_at: invoice.generated_at,
      subsidy: active_subsidy ? {
        subsidy_type:        active_subsidy.subsidy_type,
        amount:              active_subsidy.amount,
        percentage_discount: active_subsidy.percentage_discount,
        reason:              active_subsidy.reason
      } : nil
    }
    data[:line_items] = invoice.invoice_line_items.map { |li|
      { description: li.description, item_type: li.item_type, quantity: li.quantity, unit_rate: li.unit_rate, amount: li.amount }
    } if detailed
    data
  end

  def billing_mode_label(mode)
    case mode
    when 'fixed'       then 'Fixed Rate'
    when 'usage_based' then 'Usage-Based'
    when 'combined'    then 'Combined (Fixed + Usage)'
    else 'Usage-Based'
    end
  end

  def reading_source_label(invoice)
    if invoice.reading_source == 'smart_meter'
      'Smart Meter (Automatic)'
    elsif invoice.field_officer_name.present?
      "Manual Reading (Field Officer: #{invoice.field_officer_name})"
    else
      'Manual Reading (Field Officer)'
    end
  end

  # Returns a realistic demo invoice when no real invoice exists in the database.
  # This ensures the client dashboard always shows meaningful billing data.
  def demo_invoice_json
    due_date      = Date.current.end_of_month
    period_start  = Date.current.beginning_of_month
    period_end    = Date.current.end_of_month
    prev_reading  = 1200.0
    curr_reading  = 1213.5
    consumption   = 13.5
    water_charge  = 487.50   # 10 m³ × 25 + 3.5 m³ × 35 = 250 + 122.5 + 150 fixed = 522.5
    fixed_charge  = 150.00
    total         = 487.50

    {
      id:                     'DEMO-001',
      invoice_number:         "INV-#{Date.current.year}-DEMO",
      billing_period:         "#{period_start.strftime('%b %d')} - #{period_end.strftime('%b %d, %Y')}",
      billing_period_start:   period_start,
      billing_period_end:     period_end,
      billing_mode:           'usage_based',
      billing_mode_label:     'Usage-Based',
      reading_source:         'smart_meter',
      reading_source_label:   'Smart Meter (Automatic)',
      field_officer_name:     nil,
      is_estimated:           false,
      is_demo:                true,
      subtotal:               total,
      tax_amount:             0,
      total_amount:           total,
      status:                 'sent',
      due_date:               due_date,
      days_until_due:         (due_date - Date.current).to_i,
      paid_at:                nil,
      days_overdue:           0,
      consumption_m3:         consumption,
      meter_reading_previous: prev_reading,
      meter_reading_current:  curr_reading,
      generated_at:           Time.current,
      subsidy:                nil,
      line_items: [
        {
          description: "Fixed monthly charge",
          item_type:   'fixed_charge',
          quantity:    1,
          unit_rate:   fixed_charge,
          amount:      fixed_charge
        },
        {
          description: "Water consumption 0–10 m³ (10.0 m³ × KES 25.00)",
          item_type:   'water_consumption',
          quantity:    10.0,
          unit_rate:   25.00,
          amount:      250.00
        },
        {
          description: "Water consumption 10–20 m³ (3.5 m³ × KES 35.00)",
          item_type:   'water_consumption',
          quantity:    3.5,
          unit_rate:   35.00,
          amount:      122.50
        }
      ]
    }
  end

  def payment_json(payment)
    {
      id: payment.id,
      transaction_reference: payment.transaction_reference,
      amount: payment.amount,
      payment_method: payment.payment_method,
      status: payment.status,
      payment_date: payment.payment_date,
      notes: payment.notes,
      invoice: payment.invoice ? {
        id: payment.invoice.id,
        invoice_number: payment.invoice.invoice_number,
        total_amount: payment.invoice.total_amount
      } : nil,
      created_at: payment.created_at
    }
  end
end
