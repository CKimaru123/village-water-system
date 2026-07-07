class Api::V1::KnowledgeBaseController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show, :faqs, :water_quality_reports]
  before_action :authenticate_request, only: [:create, :update, :destroy, :admin_index]
  before_action :authorize_admin!, only: [:create, :update, :destroy, :admin_index]

  VALID_CATEGORIES = %w[general faq water_quality billing connection maintenance safety].freeze

  # GET /api/v1/knowledge_base/articles
  def index
    articles = KnowledgeBaseArticle.published
    articles = articles.by_category(params[:category]) if params[:category].present?
    articles = articles.search(params[:q]) if params[:q].present?
    articles = articles.recent.limit(params[:limit]&.to_i || 50)
    render json: { success: true, data: { articles: articles.map { |a| article_json(a, detailed: true) } } }
  end

  # GET /api/v1/knowledge_base/articles/:id
  def show
    # Admins can view any article; clients only see published ones
    scope = (current_user&.admin? || current_user&.super_admin?) ? KnowledgeBaseArticle : KnowledgeBaseArticle.published
    article = scope.find(params[:id])
    article.increment_views! unless current_user&.admin? || current_user&.super_admin?
    render json: { success: true, data: { article: article_json(article, detailed: true) } }
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: 'Article not found' }, status: :not_found
  end

  # GET /api/v1/faqs
  def faqs
    faqs = KnowledgeBaseArticle.published.by_category('faq').recent
    render json: { success: true, data: { faqs: faqs.map { |a| article_json(a, detailed: true) } } }
  end

  # GET /api/v1/water_quality_reports
  def water_quality_reports
    reports = KnowledgeBaseArticle.published.by_category('water_quality').recent
    render json: { success: true, data: { reports: reports.map { |a| article_json(a, detailed: true) } } }
  end

  # GET /api/v1/knowledge_base/articles (admin — all including unpublished)
  def admin_index
    articles = KnowledgeBaseArticle.all
    articles = articles.by_category(params[:category]) if params[:category].present?
    articles = articles.search(params[:q]) if params[:q].present?
    articles = articles.recent.limit(params[:limit]&.to_i || 100)
    render json: { success: true, data: { articles: articles.map { |a| article_json(a, detailed: true) }, total: articles.size } }
  end

  # POST /api/v1/knowledge_base/articles
  def create
    article = KnowledgeBaseArticle.new(article_params)
    article.created_by_id = current_user.id
    article.views_count ||= 0
    if article.save
      render json: { success: true, message: 'Article created successfully', data: { article: article_json(article, detailed: true) } }, status: :created
    else
      render json: { success: false, errors: article.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/knowledge_base/articles/:id
  def update
    article = KnowledgeBaseArticle.find(params[:id])
    if article.update(article_params)
      render json: { success: true, message: 'Article updated successfully', data: { article: article_json(article, detailed: true) } }
    else
      render json: { success: false, errors: article.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: 'Article not found' }, status: :not_found
  end

  # DELETE /api/v1/knowledge_base/articles/:id
  def destroy
    article = KnowledgeBaseArticle.find(params[:id])
    article.destroy!
    render json: { success: true, message: 'Article deleted successfully' }
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: 'Article not found' }, status: :not_found
  end

  private

  def authorize_admin!
    unless current_user&.admin? || current_user&.super_admin?
      render json: { success: false, message: 'Unauthorized. Admin access required.' }, status: :forbidden
    end
  end

  def article_params
    params.require(:article).permit(:title, :content, :excerpt, :category, :tags, :published)
  end

  def article_json(a, detailed: false)
    data = {
      id: a.id,
      title: a.title,
      category: a.category,
      tags: a.tags,
      published: a.published,
      excerpt: a.excerpt.presence || (a.content.present? ? a.content.truncate(180) : nil),
      views_count: a.views_count || 0,
      created_at: a.created_at,
      updated_at: a.updated_at,
      created_by_id: a.created_by_id
    }
    data[:content] = a.content if detailed
    data
  end
end
