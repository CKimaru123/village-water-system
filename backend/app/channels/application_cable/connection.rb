module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Extract token from query parameters or headers
      token = request.params[:token] || request.headers['Authorization']&.gsub('Bearer ', '')
      
      if token.present?
        begin
          user = JwtService.get_user_from_token(token)
          if user
            Rails.logger.info "WebSocket connection established for: #{user.display_name} (#{user.role})"
            user
          else
            reject_unauthorized_connection
          end
        rescue => e
          Rails.logger.error "WebSocket authentication error: #{e.message}"
          reject_unauthorized_connection
        end
      else
        reject_unauthorized_connection
      end
    end
  end
end