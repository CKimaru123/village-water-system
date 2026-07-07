class JwtService
  # Secret key for JWT encoding/decoding
  SECRET_KEY = Rails.application.credentials.secret_key_base || 'your-secret-key'
  
  # Token expiration times
  ACCESS_TOKEN_EXPIRATION = 24.hours
  REFRESH_TOKEN_EXPIRATION = 7.days

  class << self
    # Generate access token for user
    def encode_access_token(user_id)
      payload = {
        user_id: user_id,
        exp: ACCESS_TOKEN_EXPIRATION.from_now.to_i,
        type: 'access'
      }
      JWT.encode(payload, SECRET_KEY, 'HS256')
    end

    # Generate refresh token for user
    def encode_refresh_token(user_id)
      payload = {
        user_id: user_id,
        exp: REFRESH_TOKEN_EXPIRATION.from_now.to_i,
        type: 'refresh'
      }
      JWT.encode(payload, SECRET_KEY, 'HS256')
    end

    # Decode and verify token
    def decode_token(token)
      begin
        decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: 'HS256' })
        decoded[0] # Return payload
      rescue JWT::DecodeError => e
        Rails.logger.error "JWT Decode Error: #{e.message}"
        nil
      rescue JWT::ExpiredSignature => e
        Rails.logger.error "JWT Expired: #{e.message}"
        nil
      end
    end

    # Get user from token
    def get_user_from_token(token)
      payload = decode_token(token)
      return nil unless payload

      user_id = payload['user_id']
      User.find_by(id: user_id)
    rescue ActiveRecord::RecordNotFound
      nil
    end

    # Check if token is expired
    def token_expired?(token)
      payload = decode_token(token)
      return true unless payload

      exp_time = Time.at(payload['exp'])
      exp_time < Time.current
    end

    # Generate both access and refresh tokens
    def generate_tokens(user)
      {
        access_token: encode_access_token(user.id),
        refresh_token: encode_refresh_token(user.id),
        expires_at: ACCESS_TOKEN_EXPIRATION.from_now.iso8601
      }
    end
  end
end