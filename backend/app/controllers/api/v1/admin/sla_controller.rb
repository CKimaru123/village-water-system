class Api::V1::Admin::SlaController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/sla/breaches
  # SLA: tickets open > 48h = breach, > 24h = warning
  def breaches
    breach_threshold   = 48.hours.ago
    warning_threshold  = 24.hours.ago

    breached = Ticket.open_tickets.where('created_at < ?', breach_threshold).includes(:user, :assigned_to)
    warnings = Ticket.open_tickets.where(created_at: breach_threshold..warning_threshold).includes(:user, :assigned_to)

    render_success({
      breaches: breached.map { |t| sla_ticket_json(t, 'breach') },
      warnings: warnings.map { |t| sla_ticket_json(t, 'warning') },
      breach_count:  breached.count,
      warning_count: warnings.count,
      compliance_rate: compliance_rate
    }, 'SLA data retrieved')
  end

  # POST /api/v1/admin/sla/tickets/:id/escalate
  def escalate
    ticket = Ticket.find(params[:id])
    ticket.update!(priority: 'urgent')

    User.where(role: 'super_admin').each do |sa|
      Notification.create!(
        user_id: sa.id, title: 'Ticket Escalated',
        message: "Ticket ##{ticket.ticket_number} has been escalated: #{ticket.subject}",
        category: 'support', notification_type: 'escalation', priority: 'high',
        action_url: '/admin/ticketing'
      )
    end

    Notification.create!(
      user_id: ticket.user_id, title: 'Your Ticket Has Been Escalated',
      message: "Your ticket \"#{ticket.subject}\" has been escalated for priority handling.",
      category: 'support', notification_type: 'escalation', priority: 'high',
      action_url: '/client/track-tickets'
    )

    render_success({ ticket: { id: ticket.id, priority: ticket.priority } }, 'Ticket escalated')
  rescue ActiveRecord::RecordNotFound
    render_error('Ticket not found', [], :not_found)
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def sla_ticket_json(t, breach_level)
    hours_open = ((Time.current - t.created_at) / 3600).round(1)
    { id: t.id, ticket_number: t.ticket_number, subject: t.subject,
      priority: t.priority, status: t.status,
      user: { id: t.user.id, name: t.user.display_name },
      assigned_to: t.assigned_to&.display_name,
      hours_open: hours_open, breach_level: breach_level,
      created_at: t.created_at }
  end

  def compliance_rate
    total = Ticket.where('created_at > ?', 30.days.ago).count
    return 100.0 if total.zero?
    breached = Ticket.where('created_at > ? AND created_at < ?', 30.days.ago, 48.hours.ago)
                     .open_tickets.count
    (((total - breached).to_f / total) * 100).round(1)
  end
end
