class Api::V1::Admin::AppealsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin
  before_action :set_appeal, only: [:show, :approve, :deny, :mark_under_review]

  # GET /api/v1/admin/appeals
  def index
    @appeals = Appeal.includes(:user, :original_action, :reviewed_by)
                    .recent

    # Apply filters
    @appeals = @appeals.where(status: params[:status]) if params[:status].present?
    @appeals = @appeals.by_priority(params[:priority]) if params[:priority].present?
    
    # Search by user name or account number
    if params[:search].present?
      @appeals = @appeals.joins(:user)
                        .where("users.first_name LIKE ? OR users.last_name LIKE ? OR users.institution_name LIKE ? OR users.phone LIKE ?",
                              "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%")
    end

    # Pagination
    page = params[:page]&.to_i || 1
    per_page = [params[:per_page]&.to_i || 20, 50].min
    
    @appeals = @appeals.limit(per_page).offset((page - 1) * per_page)
    
    render_success({
      appeals: @appeals.map { |appeal| appeal_data(appeal) },
      pagination: {
        page: page,
        per_page: per_page,
        total: Appeal.count
      },
      stats: {
        pending: Appeal.pending.count,
        under_review: Appeal.under_review.count,
        approved: Appeal.approved.count,
        denied: Appeal.denied.count,
        high_priority: Appeal.high_priority.count,
        total: Appeal.count
      }
    }, 'Appeals retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Admin appeals error: #{e.message}"
    render_error('Unable to retrieve appeals.')
  end

  # GET /api/v1/admin/appeals/:id
  def show
    render_success({
      appeal: appeal_data(@appeal, include_details: true)
    }, 'Appeal retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Admin appeal show error: #{e.message}"
    render_error('Unable to retrieve appeal.')
  end

  # POST /api/v1/admin/appeals/:id/approve
  def approve
    unless @appeal.can_be_reviewed?
      render_error('Appeal cannot be approved in its current state.')
      return
    end

    # Only super admins can approve appeals
    unless current_user.super_admin?
      render_error('Only super admins can approve appeals.', [], :forbidden)
      return
    end

    resolution = params[:resolution]
    if resolution.blank?
      render_error('Resolution text is required when approving an appeal.')
      return
    end

    @appeal.approve!(current_user, resolution)
    
    render_success({
      appeal: appeal_data(@appeal)
    }, 'Appeal approved successfully')
  rescue StandardError => e
    Rails.logger.error "Appeal approval error: #{e.message}"
    render_error('Unable to approve appeal.')
  end

  # POST /api/v1/admin/appeals/:id/deny
  def deny
    unless @appeal.can_be_reviewed?
      render_error('Appeal cannot be denied in its current state.')
      return
    end

    resolution = params[:resolution]
    if resolution.blank?
      render_error('Resolution text is required when denying an appeal.')
      return
    end

    @appeal.deny!(current_user, resolution)
    
    render_success({
      appeal: appeal_data(@appeal)
    }, 'Appeal denied successfully')
  rescue StandardError => e
    Rails.logger.error "Appeal denial error: #{e.message}"
    render_error('Unable to deny appeal.')
  end

  # POST /api/v1/admin/appeals/:id/mark_under_review
  def mark_under_review
    unless @appeal.status == 'pending'
      render_error('Appeal cannot be marked under review in its current state.')
      return
    end

    @appeal.mark_under_review!(current_user)
    
    render_success({
      appeal: appeal_data(@appeal)
    }, 'Appeal marked as under review')
  rescue StandardError => e
    Rails.logger.error "Appeal review marking error: #{e.message}"
    render_error('Unable to mark appeal under review.')
  end

  private

  def ensure_admin
    unless current_user&.admin? || current_user&.super_admin?
      render_error('Access denied. Admin privileges required.', [], :forbidden)
    end
  end

  def set_appeal
    @appeal = Appeal.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Appeal not found.', [], :not_found)
  end

  def appeal_data(appeal, include_details: false)
    data = {
      id: appeal.id,
      user: {
        id: appeal.user.id,
        display_name: appeal.user.display_name,
        account_number: appeal.user.account_number,
        phone: appeal.user.phone,
        current_status: appeal.user.status
      },
      reason: appeal.reason,
      status: appeal.status,
      priority: appeal.priority,
      priority_color: appeal.priority_color,
      days_since_submitted: appeal.days_since_submitted,
      is_overdue: appeal.is_overdue?,
      created_at: appeal.created_at,
      reviewed_at: appeal.reviewed_at,
      reviewed_by: appeal.reviewed_by&.display_name,
      resolution: appeal.resolution
    }

    if include_details
      data.merge!({
        original_action: {
          id: appeal.original_action.id,
          from_status: appeal.original_action.from_status,
          to_status: appeal.original_action.to_status,
          reason: appeal.original_action.reason,
          change_type: appeal.original_action.change_type,
          changed_by: appeal.original_action.changed_by.display_name,
          created_at: appeal.original_action.created_at,
          formatted_timestamp: appeal.original_action.formatted_timestamp
        },
        supporting_documents: appeal.supporting_documents,
        user_details: {
          email: appeal.user.email,
          account_type: appeal.user.account_type,
          role: appeal.user.role
        }
      })
    end

    data
  end
end