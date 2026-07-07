class Api::V1::GalleryItemsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show]
  before_action :authenticate_request, only: [:create, :update, :destroy]
  before_action :ensure_admin, only: [:create, :update, :destroy]
  before_action :set_gallery_item, only: [:show, :update, :destroy]

  # GET /api/v1/gallery_items
  def index
    @gallery_items = GalleryItem.active.ordered
    
    # Filter by category if provided
    @gallery_items = @gallery_items.by_category(params[:category]) if params[:category].present?
    
    # Filter featured items if requested
    @gallery_items = @gallery_items.featured if params[:featured] == 'true'
    
    render_success({
      gallery_items: @gallery_items.map { |item| gallery_item_data(item) },
      categories: GalleryItem.categories
    }, 'Gallery items retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Gallery items index error: #{e.message}"
    render_error('Unable to retrieve gallery items.')
  end

  # GET /api/v1/gallery_items/:id
  def show
    render_success({
      gallery_item: gallery_item_data(@gallery_item, include_metadata: true)
    }, 'Gallery item retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Gallery item show error: #{e.message}"
    render_error('Unable to retrieve gallery item.')
  end

  # POST /api/v1/gallery_items
  def create
    @gallery_item = GalleryItem.new(gallery_item_params)
    @gallery_item.created_by = current_user
    
    if @gallery_item.save
      render_success({
        gallery_item: gallery_item_data(@gallery_item, include_metadata: true)
      }, 'Gallery item created successfully', :created)
    else
      render_error('Failed to create gallery item', @gallery_item.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Gallery item creation error: #{e.message}"
    render_error('An error occurred while creating gallery item.')
  end

  # PATCH/PUT /api/v1/gallery_items/:id
  def update
    @gallery_item.updated_by = current_user
    
    if @gallery_item.update(gallery_item_params)
      render_success({
        gallery_item: gallery_item_data(@gallery_item, include_metadata: true)
      }, 'Gallery item updated successfully')
    else
      render_error('Failed to update gallery item', @gallery_item.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Gallery item update error: #{e.message}"
    render_error('An error occurred while updating gallery item.')
  end

  # DELETE /api/v1/gallery_items/:id
  def destroy
    @gallery_item.destroy!
    render_success({}, 'Gallery item deleted successfully')
  rescue StandardError => e
    Rails.logger.error "Gallery item delete error: #{e.message}"
    render_error('Unable to delete gallery item.')
  end

  private

  def set_gallery_item
    @gallery_item = GalleryItem.find(params[:id])
  end

  def gallery_item_params
    params.require(:gallery_item).permit(
      :title, :description, :large_image_url, :small_image_url, 
      :category, :tags, :featured, :active, :sort_order
    )
  end

  def gallery_item_data(item, include_metadata: false)
    data = {
      id: item.id,
      title: item.title,
      description: item.description,
      largeImage: item.large_image_url,
      smallImage: item.small_image_url,
      category: item.category,
      tags: item.tags_array,
      featured: item.featured,
      active: item.active,
      sortOrder: item.sort_order,
      createdAt: item.created_at,
      formattedCreatedAt: item.formatted_created_at
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
end