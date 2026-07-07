class Api::V1::Admin::ClientsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/clients
  # Client Lookup — search and list all client accounts (Section 2.2)
  def index
    # Default to clients only; pass include_all=true to include admins with connections
    clients = if params[:include_all] == 'true'
                User.includes(:connections, :documents, :invoices)
              else
                User.client.includes(:connections, :documents, :invoices)
              end

    # Search by name, phone, email, or account number
    if params[:search].present?
      q = "%#{params[:search]}%"
      clients = clients.where(
        "first_name LIKE ? OR last_name LIKE ? OR institution_name LIKE ? OR phone LIKE ? OR email LIKE ? OR account_number LIKE ?",
        q, q, q, q, q, q
      )
    end

    clients = clients.where(status: params[:status]) if params[:status].present?
    clients = clients.where(account_type: params[:account_type]) if params[:account_type].present?

    page     = (params[:page] || 1).to_i
    per_page = [(params[:per_page] || 20).to_i, 100].min
    total    = clients.count
    clients  = clients.order(created_at: :desc).offset((page - 1) * per_page).limit(per_page)

    render_success({
      clients: clients.map { |u| client_summary(u) },
      pagination: {
        current_page: page, per_page: per_page,
        total_count: total, total_pages: (total.to_f / per_page).ceil
      },
      stats: {
        total:    User.client.count,
        active:   User.client.active.count,
        inactive: User.client.where(status: 'inactive').count,
        suspended: User.client.where(status: 'suspended').count
      }
    }, 'Clients retrieved')
  end

  # GET /api/v1/admin/clients/:id
  def show
    user = User.find(params[:id])

    connection = begin
      user.connections.first
    rescue
      nil
    end

    documents = begin
      user.documents.map { |d|
        { id: d.id, document_type: d.document_type, status: d.status, uploaded_at: d.uploaded_at }
      }
    rescue
      []
    end

    recent_invoices = begin
      user.invoices.order(created_at: :desc).limit(5).map { |i|
        { id: i.id, invoice_number: i.invoice_number, total_amount: i.total_amount,
          status: i.status, due_date: i.due_date }
      }
    rescue
      []
    end

    render_success({
      client: client_summary(user),
      connection: connection ? {
        id: connection.id, connection_number: connection.connection_number,
        meter_number: connection.meter_number, zone: connection.zone,
        connection_status: connection.connection_status, connection_type: connection.connection_type
      } : nil,
      documents: documents,
      recent_invoices: recent_invoices,
      pending_requests: (user.respond_to?(:status_requests) ? user.status_requests.pending.count : 0),
      open_tickets: (user.tickets.where(status: %w[open in_progress]).count rescue 0)
    }, 'Client retrieved')
  rescue ActiveRecord::RecordNotFound
    render_error('Client not found', [], :not_found)
  rescue => e
    Rails.logger.error "ClientsController#show error: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    render_error("Error retrieving client: #{e.message}", [], :internal_server_error)
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def client_summary(user)
    {
      id: user.id,
      display_name: user.display_name,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      account_number: user.account_number,
      account_type: user.account_type,
      status: user.status,
      village: user.village,
      plot_number: user.plot_number,
      institution_name: user.institution_name,
      contact_person: user.contact_person,
      has_active_connection: (user.connections.any? { |c| c.connection_status == 'active' } rescue false),
      outstanding_balance: (user.invoices.where(status: %w[unpaid overdue]).sum(:total_amount) rescue 0),
      created_at: user.created_at
    }
  end
end
