class Api::V1::Admin::SystemController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_super_admin

  # GET /api/v1/admin/system/health  (2.46)
  def health
    render_success({
      status: 'healthy',
      database: database_status,
      tables: {
        users:        User.count,
        connections:  Connection.count,
        invoices:     Invoice.count,
        payments:     Payment.count,
        tickets:      Ticket.count,
        notifications: Notification.count
      },
      checked_at: Time.current
    }, 'System health retrieved')
  rescue => e
    render json: { success: false, status: 'unhealthy', error: e.message }, status: :service_unavailable
  end

  # POST /api/v1/admin/data_import  (2.48)
  def data_import
    import_type = params[:import_type]
    records     = params[:records]

    unless records.is_a?(Array) && records.any?
      return render_error('No records provided for import')
    end

    imported = 0
    errors   = []

    case import_type
    when 'meter_readings'
      records.each_with_index do |row, idx|
        conn = Connection.find_by(connection_number: row[:connection_number] || row['connection_number'])
        next errors << "Row #{idx + 1}: connection not found" unless conn
        mr = MeterReading.new(connection: conn, reading_value: row[:reading_value] || row['reading_value'],
                              reading_date: row[:reading_date] || row['reading_date'],
                              reading_type: 'manual', recorded_by: current_user)
        mr.save ? imported += 1 : errors << "Row #{idx + 1}: #{mr.errors.full_messages.join(', ')}"
      end
    when 'clients'
      records.each_with_index do |row, idx|
        # Dry-run validation only — actual creation goes through auth/signup
        errors << "Row #{idx + 1}: use signup endpoint for client creation"
      end
    end

    render_success({ import_type: import_type, imported: imported,
                     errors: errors, total: records.count }, 'Import completed')
  end

  private

  def ensure_super_admin
    render_error('Super admin access required.', [], :forbidden) unless current_user&.super_admin?
  end

  def database_status
    ActiveRecord::Base.connection.execute('SELECT 1')
    'connected'
  rescue
    'disconnected'
  end
end
