class ProfileUpdatesChannel < ApplicationCable::Channel
  def subscribed
    # Subscribe to updates for the current user
    if current_user.client?
      # Clients only get updates for their own profile
      stream_from "client_#{current_user.id}"
    elsif current_user.admin? || current_user.super_admin?
      # Admins get updates for all clients
      stream_from "admin_updates"
      
      # Also subscribe to specific client updates if client_id is provided
      if params[:client_id].present?
        stream_from "client_#{params[:client_id]}"
      end
    end
    
    Rails.logger.info "ProfileUpdatesChannel: #{current_user.display_name} (#{current_user.role}) subscribed"
  end

  def unsubscribed
    Rails.logger.info "ProfileUpdatesChannel: #{current_user&.display_name} unsubscribed"
  end

  def subscribe_to_client(data)
    # Allow admins to subscribe to specific client updates
    if (current_user.admin? || current_user.super_admin?) && data['client_id'].present?
      stream_from "client_#{data['client_id']}"
      Rails.logger.info "Admin #{current_user.display_name} subscribed to client #{data['client_id']} updates"
    end
  end
end