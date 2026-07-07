class Api::V1::Admin::DocumentsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # POST /api/v1/admin/documents/generate
  # Generates a document (invoice PDF, connection letter, etc.) for a client
  def generate
    user = User.find_by(id: params[:user_id])
    return render_error('Client not found', [], :not_found) unless user

    doc_type = params[:document_type] || 'invoice'

    case doc_type
    when 'invoice'
      invoice = user.invoices.find_by(id: params[:invoice_id]) ||
                user.invoices.order(created_at: :desc).first
      return render_error('No invoice found for this client') unless invoice

      content = generate_invoice_text(invoice, user)
      filename = "invoice_#{invoice.invoice_number}.txt"

    when 'connection_letter'
      connection = user.connections.find_by(connection_status: 'active') ||
                   user.connections.order(created_at: :desc).first
      return render_error('No connection found for this client') unless connection

      content = generate_connection_letter(connection, user)
      filename = "connection_letter_#{user.id}.txt"

    when 'statement'
      payments = user.payments.order(payment_date: :desc).limit(12)
      content  = generate_statement(payments, user)
      filename = "statement_#{user.id}_#{Date.current}.txt"

    else
      return render_error("Unknown document type: #{doc_type}")
    end

    # Log the generation as an audit entry
    AuditLog.create!(
      user: current_user,
      action: 'document_generated',
      resource_type: 'Document',
      resource_id: user.id,
      details: { document_type: doc_type, for_user_id: user.id, filename: filename }.to_json
    ) rescue nil

    render json: {
      success: true,
      message: 'Document generated successfully',
      data: {
        filename: filename,
        document_type: doc_type,
        content: content,
        generated_at: Time.current,
        generated_for: { id: user.id, name: user.display_name }
      }
    }
  rescue ActiveRecord::RecordNotFound
    render_error('Record not found', [], :not_found)
  rescue => e
    render_error(e.message)
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def generate_invoice_text(invoice, user)
    lines = []
    lines << "INVOICE"
    lines << "=" * 40
    lines << "Invoice #: #{invoice.invoice_number}"
    lines << "Client:    #{user.display_name}"
    lines << "Period:    #{invoice.billing_period}"
    lines << "Due Date:  #{invoice.due_date&.strftime('%B %d, %Y')}"
    lines << "Status:    #{invoice.status.upcase}"
    lines << "-" * 40
    invoice.invoice_line_items.each do |li|
      lines << "#{li.description}: KES #{li.amount}"
    end
    lines << "-" * 40
    lines << "Subtotal:  KES #{invoice.subtotal}"
    lines << "Tax:       KES #{invoice.tax_amount || 0}"
    lines << "TOTAL:     KES #{invoice.total_amount}"
    lines << "=" * 40
    lines << "Generated: #{Time.current.strftime('%Y-%m-%d %H:%M')}"
    lines.join("\n")
  end

  def generate_connection_letter(connection, user)
    lines = []
    lines << "WATER CONNECTION CONFIRMATION LETTER"
    lines << "=" * 40
    lines << "Date: #{Date.current.strftime('%B %d, %Y')}"
    lines << ""
    lines << "Dear #{user.display_name},"
    lines << ""
    lines << "This letter confirms your water connection details:"
    lines << ""
    lines << "Connection Number: #{connection.connection_number}"
    lines << "Account Type:      #{user.account_type}"
    lines << "Status:            #{connection.connection_status.upcase}"
    lines << "Connected On:      #{connection.connection_date&.strftime('%B %d, %Y')}"
    lines << "Zone:              #{connection.zone || 'N/A'}"
    lines << ""
    lines << "Please retain this letter for your records."
    lines << ""
    lines << "Village Water Authority"
    lines.join("\n")
  end

  def generate_statement(payments, user)
    lines = []
    lines << "ACCOUNT STATEMENT"
    lines << "=" * 40
    lines << "Client: #{user.display_name}"
    lines << "Date:   #{Date.current.strftime('%B %d, %Y')}"
    lines << "-" * 40
    lines << "#{"Date".ljust(12)} #{"Method".ljust(15)} #{"Reference".ljust(20)} Amount"
    lines << "-" * 40
    payments.each do |p|
      lines << "#{p.payment_date&.strftime('%Y-%m-%d').to_s.ljust(12)} #{p.payment_method.to_s.ljust(15)} #{p.transaction_reference.to_s.ljust(20)} KES #{p.amount}"
    end
    lines << "-" * 40
    total = payments.sum(&:amount)
    lines << "Total Paid: KES #{total}"
    lines << "=" * 40
    lines.join("\n")
  end
end
