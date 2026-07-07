class Api::V1::TicketsController < ApplicationController
  before_action :authenticate_request  # override parent — all ticket actions require auth
  before_action :set_ticket, only: [:show, :update, :add_update]
  before_action :authorize_admin!, only: [:index_all]

  # GET /api/v1/tickets - Client's own tickets
  def index
    tickets = current_user.tickets.includes(:ticket_updates, :assigned_to).recent
    tickets = tickets.where(status: params[:status]) if params[:status].present?
    render json: { success: true, data: { tickets: tickets.map { |t| ticket_json(t) } } }
  end

  # GET /api/v1/tickets/admin/all - Admin gets all tickets
  def index_all
    tickets = Ticket.includes(:user, :ticket_updates, :assigned_to).recent
    tickets = tickets.where(status: params[:status]) if params[:status].present?
    tickets = tickets.where(priority: params[:priority]) if params[:priority].present?
    render json: { success: true, data: { tickets: tickets.map { |t| ticket_json(t, include_user: true) } } }
  end

  # GET /api/v1/tickets/:id
  def show
    render json: { success: true, data: { ticket: ticket_json(@ticket, detailed: true) } }
  end

  # POST /api/v1/tickets - Client creates ticket
  def create
    ticket = current_user.tickets.build(ticket_params)
    if ticket.save
      CrossDashboardService.on_ticket_submitted(ticket)
      render json: { success: true, message: 'Ticket submitted', data: { ticket: ticket_json(ticket) } }, status: :created
    else
      render json: { success: false, errors: ticket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/tickets/:id - Admin updates ticket
  def update
    authorize_admin!
    return if performed?
    old_status = @ticket.status
    if @ticket.update(ticket_update_params)
      if old_status != @ticket.status
        if @ticket.status == 'resolved'
          CrossDashboardService.on_ticket_resolved(@ticket, current_user)
        else
          CrossDashboardService.on_ticket_updated(@ticket, current_user, "Status changed to #{@ticket.status.humanize}")
        end
      end
      render json: { success: true, message: 'Ticket updated', data: { ticket: ticket_json(@ticket) } }
    else
      render json: { success: false, errors: @ticket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/tickets/:id/updates - Add reply
  def add_update
    tu = @ticket.ticket_updates.build(user: current_user, message: params[:message], is_internal: false)
    if tu.save
      if current_user.id == @ticket.user_id
        # Client replied — notify admin
        CrossDashboardService.on_ticket_submitted(@ticket) rescue nil
      else
        # Admin replied — notify client
        CrossDashboardService.on_ticket_updated(@ticket, current_user, params[:message])
      end
      render json: { success: true, data: { update: update_json(tu) } }, status: :created
    else
      render json: { success: false, errors: tu.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_ticket
    @ticket = current_user.admin? || current_user.super_admin? ? Ticket.find(params[:id]) : current_user.tickets.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: 'Ticket not found' }, status: :not_found
  end

  def authorize_admin!
    render json: { success: false, message: 'Unauthorized' }, status: :forbidden unless current_user.admin? || current_user.super_admin?
  end

  def ticket_params
    params.require(:ticket).permit(:subject, :description, :category, :priority)
  end

  def ticket_update_params
    params.permit(:status, :priority, :assigned_to_id, :resolved_at, :resolution_notes)
  end

  def ticket_json(ticket, detailed: false, include_user: false)
    data = {
      id: ticket.id, ticket_number: ticket.ticket_number, subject: ticket.subject,
      description: ticket.description, category: ticket.category, priority: ticket.priority,
      status: ticket.status, resolution_notes: ticket.resolution_notes, resolved_at: ticket.resolved_at,
      assigned_to: ticket.assigned_to ? { id: ticket.assigned_to.id, name: ticket.assigned_to.display_name } : nil,
      updates_count: ticket.ticket_updates.public_updates.count,
      # Always include updates so the client can show the full thread
      updates: ticket.ticket_updates.public_updates.recent.map { |u| update_json(u) },
      created_at: ticket.created_at, updated_at: ticket.updated_at
    }
    data[:user] = { id: ticket.user.id, name: ticket.user.display_name, phone: ticket.user.phone } if include_user
    data
  end

  def update_json(u)
    { id: u.id, message: u.message, user: { id: u.user.id, name: u.user.display_name, role: u.user.role }, created_at: u.created_at }
  end
end
