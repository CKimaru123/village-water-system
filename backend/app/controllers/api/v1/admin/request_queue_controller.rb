class Api::V1::Admin::RequestQueueController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/request_queue
  # Aggregates all pending cross-dashboard items into one response (Section 3.2 / 2.58)
  def index
    # Pending status requests (pause / reactivation)
    status_requests = StatusRequest.pending.includes(:user).recent.limit(50).map do |r|
      {
        queue_type:   'status_request',
        id:           r.id,
        priority:     'normal',
        user:         { id: r.user.id, name: r.user.display_name, phone: r.user.phone },
        description:  "#{r.request_type.humanize} request: #{r.reason.truncate(80)}",
        created_at:   r.created_at
      }
    end

    # Pending appeals
    appeals = Appeal.pending.includes(:user).recent.limit(50).map do |a|
      {
        queue_type:   'appeal',
        id:           a.id,
        priority:     'high',
        user:         { id: a.user.id, name: a.user.display_name, phone: a.user.phone },
        description:  "Appeal: #{a.reason.truncate(80)}",
        created_at:   a.created_at
      }
    end

    # Pending refunds
    refunds = Refund.where(status: 'pending').includes(:user).order(created_at: :asc).limit(50).map do |r|
      {
        queue_type:   'refund',
        id:           r.id,
        priority:     'normal',
        user:         { id: r.user.id, name: r.user.display_name, phone: r.user.phone },
        description:  "Refund KES #{r.amount}: #{r.reason.truncate(60)}",
        created_at:   r.created_at
      }
    end

    # Pending documents awaiting verification
    documents = Document.unverified.includes(:user).order(uploaded_at: :asc).limit(50).map do |d|
      {
        queue_type:   'document',
        id:           d.id,
        priority:     'normal',
        user:         { id: d.user.id, name: d.user.display_name, phone: d.user.phone },
        description:  "#{d.document_type.humanize} document awaiting verification",
        created_at:   d.uploaded_at
      }
    end

    all_items = (status_requests + appeals + refunds + documents)
                  .sort_by { |item| [item[:priority] == 'high' ? 0 : 1, item[:created_at]] }

    render_success({
      queue:  all_items,
      counts: {
        status_requests: status_requests.size,
        appeals:         appeals.size,
        refunds:         refunds.size,
        documents:       documents.size,
        total:           all_items.size
      }
    }, 'Request queue retrieved')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
