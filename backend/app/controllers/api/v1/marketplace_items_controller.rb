class Api::V1::MarketplaceItemsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show]
  before_action :authenticate_request, only: [:create, :update, :destroy]
  before_action :require_auth_for_my_ads, only: [:index]
  before_action :ensure_admin, only: [:update]
  before_action :set_marketplace_item, only: [:show, :update, :destroy]

  # GET /api/v1/marketplace_items
  def index
    if params[:admin] == 'true' && (current_user&.admin? || current_user&.super_admin?)
      @marketplace_items = MarketplaceItem.all
    else
      @marketplace_items = MarketplaceItem.active
    end

    # Filter by seller
    if params[:my_ads] == 'true' && current_user
      @marketplace_items = @marketplace_items.by_seller_user(current_user.id)
    elsif params[:seller_id].present?
      @marketplace_items = @marketplace_items.where(created_by_id: params[:seller_id])
    elsif params[:user_id] == 'me' && current_user
      @marketplace_items = @marketplace_items.by_seller_user(current_user.id)
    end

    @marketplace_items = @marketplace_items.by_category(params[:category]) if params[:category].present? && params[:category] != 'All'
    @marketplace_items = @marketplace_items.search(params[:search]) if params[:search].present?
    @marketplace_items = @marketplace_items.featured if params[:featured] == 'true'
    @marketplace_items = @marketplace_items.in_stock if params[:in_stock] == 'true'
    @marketplace_items = @marketplace_items.by_location(params[:location]) if params[:location].present?

    if params[:min_price].present? && params[:max_price].present?
      @marketplace_items = @marketplace_items.by_price_range(params[:min_price], params[:max_price])
    end
    @marketplace_items = @marketplace_items.by_rating(params[:min_rating]) if params[:min_rating].present?

    case params[:sort_by]
    when 'price-low'  then @marketplace_items = @marketplace_items.price_low_to_high
    when 'price-high' then @marketplace_items = @marketplace_items.price_high_to_low
    when 'rating'     then @marketplace_items = @marketplace_items.highest_rated
    when 'popular'    then @marketplace_items = @marketplace_items.popular
    else                   @marketplace_items = @marketplace_items.recent
    end

    page     = params[:page]&.to_i || 1
    per_page = [params[:per_page]&.to_i || 20, 50].min
    total    = @marketplace_items.count
    @marketplace_items = @marketplace_items.limit(per_page).offset((page - 1) * per_page)

    render_success({
      marketplace_items: @marketplace_items.map { |item| marketplace_item_data(item) },
      categories: MarketplaceItem.categories,
      pagination: { page: page, per_page: per_page, total: total }
    }, 'Marketplace items retrieved successfully')
  rescue StandardError => e
    render_error('Unable to retrieve marketplace items.')
  end

  # GET /api/v1/marketplace_items/:id
  def show
    @marketplace_item.increment_views!
    
    render_success({
      marketplace_item: marketplace_item_data(@marketplace_item, include_metadata: true)
    }, 'Marketplace item retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Marketplace item show error: #{e.message}"
    render_error('Unable to retrieve marketplace item.')
  end

  # POST /api/v1/marketplace_items — admin only
  def create
    unless current_user&.admin? || current_user&.super_admin?
      return render_error('Only admins can create marketplace listings.', [], :forbidden)
    end
    @marketplace_item = MarketplaceItem.new(marketplace_item_params)
    @marketplace_item.created_by = current_user
    if @marketplace_item.save
      render_success({ marketplace_item: marketplace_item_data(@marketplace_item, include_metadata: true) },
        'Marketplace item created successfully', :created)
    else
      render_error(@marketplace_item.errors.full_messages.first, @marketplace_item.errors.full_messages, :unprocessable_entity)
    end
  rescue StandardError => e
    Rails.logger.error "Marketplace item create error: #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    render_error("An error occurred: #{e.message}")
  end

  # PATCH/PUT /api/v1/marketplace_items/:id
  def update
    @marketplace_item.updated_by = current_user
    
    if @marketplace_item.update(marketplace_item_params)
      render_success({
        marketplace_item: marketplace_item_data(@marketplace_item, include_metadata: true)
      }, 'Marketplace item updated successfully')
    else
      render_error('Failed to update marketplace item', @marketplace_item.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Marketplace item update error: #{e.message}"
    render_error('An error occurred while updating marketplace item.')
  end

  # DELETE /api/v1/marketplace_items/:id
  def destroy
    unless current_user&.can_manage_content? || @marketplace_item.created_by == current_user
      return render_error('Access denied.', [], :forbidden)
    end
    @marketplace_item.destroy!
    render_success({}, 'Marketplace item deleted successfully')
  rescue StandardError => e
    Rails.logger.error "Marketplace item delete error: #{e.message}"
    render_error('Unable to delete marketplace item.')
  end

  private

  def set_marketplace_item
    @marketplace_item = MarketplaceItem.find(params[:id])
  end

  def marketplace_item_params
    params.require(:marketplace_item).permit(
      :title, :description, :price, :category, :seller_name, :seller_phone, 
      :seller_email, :location, :rating, :reviews_count, :featured, :in_stock, 
      :active, :tags, :seller_user_id, images: [], specifications: {}
    )
  end

  def marketplace_item_data(item, include_metadata: false)
    data = {
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price.to_f,
      formattedPrice: item.formatted_price,
      category: item.category,
      seller: item.seller_name,
      sellerContact: {
        phone: item.seller_phone,
        email: item.seller_email
      },
      contact: item.seller_phone || item.seller_email,
      location: item.location,
      images: item.images_array,
      rating: item.rating.to_f,
      reviews: item.reviews_count,
      featured: item.featured,
      inStock: item.in_stock,
      active: item.active,
      specifications: item.specifications_hash,
      tags: item.tags_array,
      viewsCount: item.views_count,
      createdAt: item.created_at,
      formattedCreatedAt: item.formatted_created_at,
      sellerUserId: item.seller_user_id,
      sellerUserName: item.seller_user ? "#{item.seller_user.first_name} #{item.seller_user.last_name}".strip : nil
    }

    if include_metadata
      data.merge!({
        createdBy: {
          id: item.created_by.id,
          name: "#{item.created_by.first_name} #{item.created_by.last_name}".strip,
          email: item.created_by.email
        },
        updatedBy: item.updated_by ? {
          id: item.updated_by.id,
          name: "#{item.updated_by.first_name} #{item.updated_by.last_name}".strip,
          email: item.updated_by.email
        } : nil,
        updatedAt: item.updated_at
      })
    end

    data
  end

  def ensure_admin
    unless current_user&.can_manage_content?
      render_error('Access denied. Admin privileges required.', [], :forbidden)
    end
  end

  def require_auth_for_my_ads
    if params[:my_ads] == 'true' || params[:user_id] == 'me'
      authenticate_request
    end
  end
end