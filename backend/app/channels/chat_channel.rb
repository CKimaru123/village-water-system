class ChatChannel < ApplicationCable::Channel
  def subscribed
    session_id = params[:session_id]
    reject and return unless session_id.present?

    stream_from "chat_#{session_id}"
    Rails.logger.info "ChatChannel: #{current_user.display_name} subscribed to chat_#{session_id}"
  end

  def unsubscribed
    Rails.logger.info "ChatChannel: #{current_user&.display_name} unsubscribed"
  end

  # Client/admin sends a message via the cable
  def send_message(data)
    session_id = params[:session_id]
    return unless session_id.present? && data['message'].present?

    msg = ChatMessage.create!(
      user:        current_user,
      session_id:  session_id,
      message:     data['message'],
      sender_role: current_user.client? ? 'client' : 'admin'
    )

    ActionCable.server.broadcast("chat_#{session_id}", message_json(msg))
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
