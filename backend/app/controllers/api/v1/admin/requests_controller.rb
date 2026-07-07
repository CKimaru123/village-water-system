class Api::V1::Admin::RequestsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin
  before_action :set_request, only: [:show, :approve, :deny]

  # GET /api/v1/admin/requests
  def index
    @requests = StatusRequest.includes(:user, :requested_by, :reviewed_by)
                            .recent

    # Apply filters
    @requests = @requests.where(status: params[:status]) if params[:status].present?
    @requests = @requests.by_type(params[:request_type]) if params[:request_type].present?
    
    # Search by user name or account number
    if params[:search].present?
      @requests = @requests.joins(:user)
                          .where("users.first_name LIKE ? OR users.last_name LIKE ? OR users.institution_name LIKE ? OR users.phone LIKE ?",
                                "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%")
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = [params[:per_page]&.to_i || 20, 50].min
    
    @requests = @requests.limit(per_page).offset((page - 1) * per_page)
    
    render_success({
      requests: @requests.map { |request| request_data(request) },
      pagination: {
        page: page,
        per_page: per_page,
        total: StatusRequest.count
      },
      stats: {
        pending: StatusRequest.pending.count,
        approved: StatusRequest.approved.count,
        denied: StatusRequest.denied.count,
        total: StatusRequest.count
      }
    }, 'Requests retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Admin requests error: #{e.message}"
    render_error('Unable to retrieve requests.')
  end

  # GET /api/v1/admin/requests/:id
  def show
    render_success({
      request: request_data(@request, include_details: true)
    }, 'Request retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Admin request show error: #{e.message}"
    render_error('Unable to retrieve request.')
  end

  # POST /api/v1/admin/requests/:id/approve
  def approve
    unless @request.can_be_approved?
      render_error('Request cannot be approved in its current state.')
      return
    end

    @request.approve!(current_user, params[:admin_notes])
    CrossDashboardService.on_status_request_approved(@request, current_user)

    render_success({
      request: request_data(@request)
    }, 'Request approved successfully')
  rescue StandardError => e
    Rails.logger.error "Request approval error: #{e.message}"
    render_error('Unable to approve request.')
  end

  # POST /api/v1/admin/requests/:id/deny
  def deny
    unless @request.can_be_denied?
      render_error('Request cannot be denied in its current state.')
      return
    end

    admin_notes = params[:admin_notes]
    if admin_notes.blank?
      render_error('Admin notes are required when denying a request.')
      return
    end

    @request.deny!(current_user, admin_notes)
    CrossDashboardService.on_status_request_denied(@request, current_user)

    render_success({
      request: request_data(@request)
    }, 'Request denied successfully')
  rescue StandardError => e
    Rails.logger.error "Request denial error: #{e.message}"
    render_error('Unable to deny request.')
  end

  # GET /api/v1/admin/requests/pending-count
  def pending_count
    render_success({
      count: StatusRequest.pending.count
    }, 'Pending count retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Pending count error: #{e.message}"
    render_error('Unable to retrieve pending count.')
  end

  private

  def ensure_admin
    unless current_user&.admin? || current_user&.super_admin?
      render_error('Access denied. Admin privileges required.', [], :forbidden)
    end
  end

  def set_request
    @request = StatusRequest.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Request not found.', [], :not_found)
  end

  def request_data(request, include_details: false)
    data = {
      id: request.id,
      user: {
        id: request.user.id,
        display_name: request.user.display_name,
        account_number: request.user.account_number,
        phone: request.user.phone,
        current_status: request.user.status
      },
      request_type: request.request_type,
      from_status: request.from_status,
      to_status: request.to_status,
      reason: request.reason,
      status: request.status,
      formatted_dates: request.formatted_dates,
      created_at: request.created_at,
      reviewed_at: request.reviewed_at,
      admin_notes: request.admin_notes,
      requested_by: request.requested_by.display_name,
      reviewed_by: request.reviewed_by&.display_name
    }

    if include_details
      data.merge!({
        start_date: request.start_date,
        end_date: request.end_date,
        supporting_documents: request.supporting_documents,
        user_details: {
          email: request.user.email,
          account_type: request.user.account_type,
          role: request.user.role
        }
      })
    end

    data
  end
end