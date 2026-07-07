class Api::V1::ChatMessagesController < ApplicationController
  before_action :authenticate_request

  # GET /api/v1/chat_messages?session_id=xxx — fetch history for a session
  def index
    session_id = params[:session_id]
    return render_error('session_id is required', [], :bad_request) unless session_id.present?

    # Clients can only read their own sessions; admins can read any
    messages = if current_user.admin? || current_user.super_admin?
                 ChatMessage.for_session(session_id)
               else
                 ChatMessage.for_session(session_id).where(user_id: current_user.id)
                            .or(ChatMessage.for_session(session_id).where(sender_role: 'admin'))
               end

    render_success({ messages: messages.map { |m| message_json(m) } }, 'Messages retrieved')
  end

  # GET /api/v1/chat_messages/sessions — admin: list all active chat sessions
  def sessions
    unless current_user.admin? || current_user.super_admin?
      return render json: { success: false, message: 'Unauthorized' }, status: :forbidden
    end

    # Get distinct session_ids with latest message and unread count
    rows = ChatMessage
             .select("session_id, MAX(created_at) as last_message_at, COUNT(*) as message_count, SUM(CASE WHEN read = 0 OR read = false THEN 1 ELSE 0 END) as unread_count")
             .group(:session_id)
             .order("last_message_at DESC")

    sessions_data = rows.map do |row|
      last_msg = ChatMessage.for_session(row.session_id).last
      # Derive user from session_id (format: client-{user_id})
      user_id = row.session_id.to_s.split('-').last.to_i
      user = User.find_by(id: user_id)
      {
        session_id:      row.session_id,
        last_message:    last_msg&.message&.truncate(60),
        last_message_at: row.last_message_at,
        message_count:   row.message_count,
        unread_count:    row.unread_count.to_i,
        client_name:     user&.display_name || 'Unknown',
        client_id:       user&.id
      }
    end

    render_success({ sessions: sessions_data }, 'Sessions retrieved')
  end

  # POST /api/v1/chat_messages — HTTP fallback for sending a message
  def create
    session_id = params[:session_id]
    return render_error('session_id is required', [], :bad_request) unless session_id.present?
    return render_error('message is required', [], :bad_request) unless params[:message].present?

    msg = ChatMessage.create!(
      user:        current_user,
      session_id:  session_id,
      message:     params[:message],
      sender_role: current_user.client? ? 'client' : 'admin'
    )

    # Broadcast via ActionCable so real-time subscribers get it too
    ActionCable.server.broadcast("chat_#{session_id}", message_json(msg))

    render_success({ message: message_json(msg) }, 'Message sent', :created)
  rescue => e
    render_error(e.message)
  end

  private

  def message_json(msg)
    {
      id:          msg.id,
      message:     msg.message,
      sender_role: msg.sender_role,
      sender_name: msg.user.display_name,
      session_id:  msg.session_id,
      read:        msg.read,
      created_at:  msg.created_at
    }
  end
end
