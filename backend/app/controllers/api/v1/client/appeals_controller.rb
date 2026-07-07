class Api::V1::Client::AppealsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_client

  # GET /api/v1/client/appeals
  def index
    @appeals = current_user.appeals.recent.limit(20)
    
    render_success({
      appeals: @appeals.map { |appeal| appeal_data(appeal) }
    }, 'Appeals retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Client appeals error: #{e.message}"
    render_error('Unable to retrieve appeals.')
  end

  # POST /api/v1/client/appeals
  def create
    unless current_user.can_appeal_suspension?
      render_error('Cannot submit appeal at this time.')
      return
    end

    # Find the most recent status change that resulted in suspension
    original_action = current_user.status_histories
                                  .where(to_status: 'suspended')
                                  .recent
                                  .first

    unless original_action
      render_error('No suspendable action found to appeal.')
      return
    end

    @appeal = Appeal.new(appeal_params)
    @appeal.user = current_user
    @appeal.original_action = original_action

    if @appeal.save
      render_success({
        appeal: appeal_data(@appeal)
      }, 'Appeal submitted successfully', :created)
    else
      render_error('Failed to submit appeal', @appeal.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Appeal creation error: #{e.message}"
    render_error('An error occurred while submitting your appeal.')
  end

  # GET /api/v1/client/appeals/:id
  def show
    @appeal = current_user.appeals.find(params[:id])
    
    render_success({
      appeal: appeal_data(@appeal, include_details: true)
    }, 'Appeal retrieved successfully')
  rescue ActiveRecord::RecordNotFound
    render_error('Appeal not found.', [], :not_found)
  rescue StandardError => e
    Rails.logger.error "Appeal show error: #{e.message}"
    render_error('Unable to retrieve appeal.')
  end

  private

  def ensure_client
    unless current_user&.client?
      render_error('Access denied. Client privileges required.', [], :forbidden)
    end
  end

  def appeal_params
    params.require(:appeal).permit(:reason, :priority, supporting_documents: [])
  end

  def appeal_data(appeal, include_details: false)
    data = {
      id: appeal.id,
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
          from_status: appeal.original_action.from_status,
          to_status: appeal.original_action.to_status,
          reason: appeal.original_action.reason,
          change_type: appeal.original_action.change_type,
          changed_by: appeal.original_action.changed_by.display_name,
          created_at: appeal.original_action.created_at
        },
        supporting_documents: appeal.supporting_documents
      })
    end

    data
  end
end