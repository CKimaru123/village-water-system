class Api::V1::Client::StatusController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_client

  # GET /api/v1/client/status
  def show
    begin
      Rails.logger.info "=== CLIENT STATUS DEBUG ==="
      Rails.logger.info "Current user: #{current_user.id}"
      Rails.logger.info "User status: #{current_user.status}"
      
      # Test each method individually
      user_data = client_status_data(current_user)
      Rails.logger.info "User data: #{user_data}"
      
      can_pause = current_user.can_request_pause?
      Rails.logger.info "Can pause: #{can_pause}"
      
      can_reactivate = current_user.can_request_reactivation?
      Rails.logger.info "Can reactivate: #{can_reactivate}"
      
      can_appeal = current_user.can_appeal_suspension?
      Rails.logger.info "Can appeal: #{can_appeal}"
      
      # Check if status_requests association exists
      Rails.logger.info "Status requests count: #{current_user.status_requests.count}"
      pending_requests_count = current_user.status_requests.pending.count
      Rails.logger.info "Pending requests: #{pending_requests_count}"
      
      # Check if appeals association exists
      Rails.logger.info "Appeals count: #{current_user.appeals.count}"
      pending_appeals_count = current_user.appeals.pending.count
      Rails.logger.info "Pending appeals: #{pending_appeals_count}"

      render_success({
        user: user_data,
        can_request_pause: can_pause,
        can_request_reactivation: can_reactivate,
        can_appeal_suspension: can_appeal,
        pending_requests: pending_requests_count,
        pending_appeals: pending_appeals_count
      }, 'Status retrieved successfully')
    rescue StandardError => e
      Rails.logger.error "Client status error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render_error('Unable to retrieve status information.')
    end
  end

  # POST /api/v1/client/status/request-pause
  def request_pause
    unless current_user.can_request_pause?
      render_error('Cannot request pause at this time.')
      return
    end

    @request = StatusRequest.new(pause_request_params)
    @request.user = current_user
    @request.requested_by = current_user
    @request.request_type = 'pause'
    @request.from_status = current_user.status
    @request.to_status = 'inactive'

    if @request.save
      CrossDashboardService.on_status_request_submitted(@request)
      render_success({
        request: request_data(@request)
      }, 'Pause request submitted successfully', :created)
    else
      render_error('Failed to submit pause request', @request.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Pause request error: #{e.message}"
    render_error('An error occurred while submitting your request.')
  end

  # POST /api/v1/client/status/request-reactivation
  def request_reactivation
    unless current_user.can_request_reactivation?
      render_error('Cannot request reactivation at this time.')
      return
    end

    @request = StatusRequest.new(reactivation_request_params)
    @request.user = current_user
    @request.requested_by = current_user
    @request.request_type = 'reactivate'
    @request.from_status = current_user.status
    @request.to_status = 'active'

    if @request.save
      CrossDashboardService.on_status_request_submitted(@request)
      render_success({
        request: request_data(@request)
      }, 'Reactivation request submitted successfully', :created)
    else
      render_error('Failed to submit reactivation request', @request.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Reactivation request error: #{e.message}"
    render_error('An error occurred while submitting your request.')
  end

  # GET /api/v1/client/status/requests
  def requests
    @requests = current_user.status_requests.recent.limit(20)
    
    render_success({
      requests: @requests.map { |request| request_data(request) }
    }, 'Requests retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Client requests error: #{e.message}"
    render_error('Unable to retrieve requests.')
  end

  # GET /api/v1/client/status/history
  def history
    @history = current_user.status_histories.recent.limit(20)
    
    render_success({
      history: @history.map { |entry| history_data(entry) }
    }, 'Status history retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Client history error: #{e.message}"
    render_error('Unable to retrieve status history.')
  end

  private

  def ensure_client
    unless current_user&.client?
      render_error('Access denied. Client privileges required.', [], :forbidden)
    end
  end

  def pause_request_params
    params.require(:request).permit(:reason, :start_date, :end_date)
  end

  def reactivation_request_params
    params.require(:request).permit(:reason)
  end

  def client_status_data(user)
    {
      id: user.id,
      status: user.status,
      display_name: user.display_name,
      account_number: user.account_number,
      last_status_change: user.latest_status_change&.formatted_timestamp,
      status_change_reason: user.status_change_reason
    }
  end

  def request_data(request)
    {
      id: request.id,
      request_type: request.request_type,
      from_status: request.from_status,
      to_status: request.to_status,
      reason: request.reason,
      status: request.status,
      formatted_dates: request.formatted_dates,
      created_at: request.created_at,
      reviewed_at: request.reviewed_at,
      admin_notes: request.admin_notes,
      reviewed_by: request.reviewed_by&.display_name
    }
  end

  def history_data(entry)
    {
      id: entry.id,
      from_status: entry.from_status,
      to_status: entry.to_status,
      reason: entry.reason,
      change_type: entry.change_type,
      changed_by: entry.changed_by.display_name,
      created_at: entry.created_at,
      formatted_timestamp: entry.formatted_timestamp,
      change_description: entry.change_description
    }
  end
end