class ApplicationController < ActionController::API
  # Include authentication helpers
  include ActionController::HttpAuthentication::Token::ControllerMethods
  
  # Authentication helpers
  before_action :authenticate_request, except: [:index, :show] # Skip auth for public endpoints
  
  protected

  def authenticate_request
    token = extract_token_from_header
    @current_user = JwtService.get_user_from_token(token) if token
    
    unless @current_user
      render json: { 
        success: false, 
        message: 'Unauthorized access. Please log in.' 
      }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header
    
    # Extract token from "Bearer <token>" format
    auth_header.split(' ').last if auth_header.start_with?('Bearer ')
  end

  # Error handling
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from ActionController::ParameterMissing, with: :parameter_missing

  private

  def record_not_found(exception)
    render json: { 
      success: false, 
      message: 'Record not found',
      error: exception.message 
    }, status: :not_found
  end

  def record_invalid(exception)
    render json: { 
      success: false, 
      message: 'Validation failed',
      errors: exception.record.errors.full_messages 
    }, status: :unprocessable_entity
  end

  def parameter_missing(exception)
    render json: { 
      success: false, 
      message: 'Missing required parameter',
      error: exception.message 
    }, status: :bad_request
  end

  # Success response helper
  def render_success(data = {}, message = 'Success', status = :ok)
    render json: {
      success: true,
      message: message,
      data: data
    }, status: status
  end

  # Error response helper
  def render_error(message, errors = {}, status = :unprocessable_entity)
    render json: {
      success: false,
      message: message,
      errors: errors
    }, status: status
  end
end
