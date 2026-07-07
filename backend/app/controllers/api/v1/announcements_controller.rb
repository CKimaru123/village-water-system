class Api::V1::AnnouncementsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show]
  before_action :authenticate_request, only: [:create, :update, :destroy]
  before_action :authorize_admin!, only: [:create, :update, :destroy]

  # GET /api/v1/announcements
  def index
    if params[:admin] == 'true' && (current_user&.admin? || current_user&.super_admin?)
      # Admin sees all announcements regardless of audience or published state
      announcements = Announcement.recent
    else
      # Clients see only published announcements targeted at them
      announcements = Announcement.published.for_audience('client').recent
    end
    announcements = announcements.where(category: params[:category]) if params[:category].present?
    announcements = announcements.limit(params[:limit] || 50)

    render json: { success: true, data: { announcements: announcements.map { |a| announcement_json(a) } } }
  end

  # GET /api/v1/announcements/:id
  def show
    announcement = Announcement.find(params[:id])
    render json: { success: true, data: { announcement: announcement_json(announcement) } }
  end

  # POST /api/v1/announcements
  def create
    announcement = Announcement.new(announcement_params)
    announcement.created_by = current_user
    if announcement.save
      CrossDashboardService.on_announcement_published(announcement, current_user) if announcement.published?
      render json: { success: true, message: 'Announcement created', data: { announcement: announcement_json(announcement) } }, status: :created
    else
      render json: { success: false, errors: announcement.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/announcements/:id
  def update
    announcement = Announcement.find(params[:id])
    was_published = announcement.published?
    if announcement.update(announcement_params)
      CrossDashboardService.on_announcement_published(announcement, current_user) if announcement.published? && !was_published
      render json: { success: true, message: 'Announcement updated', data: { announcement: announcement_json(announcement) } }
    else
      render json: { success: false, errors: announcement.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/announcements/:id
  def destroy
    Announcement.find(params[:id]).destroy!
    render json: { success: true, message: 'Announcement deleted' }
  end

  private

  def authorize_admin!
    render json: { success: false, message: 'Unauthorized' }, status: :forbidden unless current_user&.admin? || current_user&.super_admin?
  end

  def announcement_params
    params.require(:announcement).permit(:title, :content, :category, :priority, :target_audience, :published, :expires_at)
  end

  def announcement_json(a)
    {
      id: a.id, title: a.title, content: a.content, category: a.category,
      priority: a.priority, target_audience: a.target_audience,
      published: a.published, published_at: a.published_at, expires_at: a.expires_at,
      created_by: a.created_by&.display_name, created_at: a.created_at
    }
  end
end
