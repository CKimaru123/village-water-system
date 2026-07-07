class Api::V1::Admin::ExportController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/export
  def index
    type   = params[:type]   || 'clients'
    format = params[:format] || 'json'

    data = case type
    when 'clients'
      User.client.includes(:connections, :invoices).map { |u|
        { id: u.id, name: u.display_name, phone: u.phone, email: u.email,
          status: u.status, account_type: u.account_type,
          account_number: u.account_number, created_at: u.created_at }
      }
    when 'invoices'
      Invoice.includes(:user).order(created_at: :desc).limit(500).map { |i|
        { invoice_number: i.invoice_number, client: i.user.display_name,
          total_amount: i.total_amount, status: i.status,
          due_date: i.due_date, billing_period: i.billing_period }
      }
    when 'payments'
      Payment.includes(:user, :invoice).where(status: 'completed').order(payment_date: :desc).limit(500).map { |p|
        { reference: p.transaction_reference, client: p.user.display_name,
          amount: p.amount, method: p.payment_method, date: p.payment_date }
      }
    when 'meter_readings'
      MeterReading.includes(connection: :user).order(reading_date: :desc).limit(500).map { |r|
        { connection: r.connection.connection_number, client: r.connection.user.display_name,
          reading_value: r.reading_value, reading_date: r.reading_date,
          consumption: r.consumption, type: r.reading_type }
      }
    else
      []
    end

    render_success({ type: type, format: format, count: data.count,
                     records: data, exported_at: Time.current,
                     exported_by: current_user.display_name }, 'Export data ready')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
