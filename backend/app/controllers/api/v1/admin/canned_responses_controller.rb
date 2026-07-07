class Api::V1::Admin::CannedResponsesController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    responses = CannedResponse.active
    responses = responses.by_category(params[:category]) if params[:category].present?
    render_success({ canned_responses: responses.recent.map { |r| response_json(r) } }, 'Canned responses retrieved')
  end

  def create
    response = CannedResponse.new(response_params)
    response.created_by = current_user
    if response.save
      render_success({ canned_response: response_json(response) }, 'Canned response created', :created)
    else
      render_error('Failed to create canned response', response.errors.full_messages)
    end
  end

  def update
    response = CannedResponse.find(params[:id])
    if response.update(response_params)
      render_success({ canned_response: response_json(response) }, 'Canned response updated')
    else
      render_error('Failed to update', response.errors.full_messages)
    end
  end

  def destroy
    CannedResponse.find(params[:id]).update!(active: false)
    render_success({}, 'Canned response deactivated')
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def response_params
    params.require(:canned_response).permit(:title, :body, :category, :active)
  end

  def response_json(r)
    { id: r.id, title: r.title, body: r.body, category: r.category,
      active: r.active, created_at: r.created_at }
  end
end
