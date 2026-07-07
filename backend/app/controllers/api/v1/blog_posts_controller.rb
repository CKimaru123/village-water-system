class Api::V1::BlogPostsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show]
  before_action :authenticate_request, only: [:create, :update, :destroy, :like]
  before_action :ensure_admin, only: [:create, :update, :destroy]
  before_action :set_blog_post, only: [:show, :update, :destroy, :like]

  # GET /api/v1/blog_posts
  def index
    @blog_posts = BlogPost.published
    
    # Apply filters
    @blog_posts = @blog_posts.by_category(params[:category]) if params[:category].present? && params[:category] != 'all'
    @blog_posts = @blog_posts.search(params[:search]) if params[:search].present?
    @blog_posts = @blog_posts.featured if params[:featured] == 'true'
    @blog_posts = @blog_posts.by_author(params[:author]) if params[:author].present?
    
    # Sorting
    case params[:sort_by]
    when 'popular'
      @blog_posts = @blog_posts.popular
    when 'liked'
      @blog_posts = @blog_posts.most_liked
    else
      @blog_posts = @blog_posts.recent
    end
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = [params[:per_page]&.to_i || 20, 50].min
    
    @blog_posts = @blog_posts.limit(per_page).offset((page - 1) * per_page)
    
    render_success({
      blog_posts: @blog_posts.map { |post| blog_post_data(post) },
      categories: BlogPost.categories,
      pagination: {
        page: page,
        per_page: per_page,
        total: BlogPost.published.count
      }
    }, 'Blog posts retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Blog posts index error: #{e.message}"
    render_error('Unable to retrieve blog posts.')
  end

  # GET /api/v1/blog_posts/:id
  def show
    @blog_post.increment_views!
    
    render_success({
      blog_post: blog_post_data(@blog_post, include_metadata: true, include_content: true)
    }, 'Blog post retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Blog post show error: #{e.message}"
    render_error('Unable to retrieve blog post.')
  end

  # POST /api/v1/blog_posts
  def create
    @blog_post = BlogPost.new(blog_post_params)
    @blog_post.created_by = current_user
    @blog_post.author_name ||= "#{current_user.first_name} #{current_user.last_name}".strip
    @blog_post.author_email ||= current_user.email
    
    if @blog_post.save
      render_success({
        blog_post: blog_post_data(@blog_post, include_metadata: true, include_content: true)
      }, 'Blog post created successfully', :created)
    else
      render_error('Failed to create blog post', @blog_post.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Blog post creation error: #{e.message}"
    render_error('An error occurred while creating blog post.')
  end

  # PATCH/PUT /api/v1/blog_posts/:id
  def update
    @blog_post.updated_by = current_user
    
    if @blog_post.update(blog_post_params)
      render_success({
        blog_post: blog_post_data(@blog_post, include_metadata: true, include_content: true)
      }, 'Blog post updated successfully')
    else
      render_error('Failed to update blog post', @blog_post.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Blog post update error: #{e.message}"
    render_error('An error occurred while updating blog post.')
  end

  # DELETE /api/v1/blog_posts/:id
  def destroy
    @blog_post.destroy!
    render_success({}, 'Blog post deleted successfully')
  rescue StandardError => e
    Rails.logger.error "Blog post delete error: #{e.message}"
    render_error('Unable to delete blog post.')
  end

  # POST /api/v1/blog_posts/:id/like
  def like
    @blog_post.increment_likes!
    render_success({
      likes_count: @blog_post.likes_count
    }, 'Blog post liked successfully')
  rescue StandardError => e
    Rails.logger.error "Blog post like error: #{e.message}"
    render_error('Unable to like blog post.')
  end

  private

  def set_blog_post
    @blog_post = BlogPost.find_by(slug: params[:id]) || BlogPost.find(params[:id])
  end

  def blog_post_params
    params.require(:blog_post).permit(
      :title, :excerpt, :content, :category_id, :image_url, :author_name, 
      :author_email, :tags, :featured, :published, :meta_description
    )
  end

  def blog_post_data(post, include_metadata: false, include_content: false)
    data = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category_id,
      categoryInfo: {
        id: post.category_id,
        name: post.category_name,
        color: post.category_color,
        icon: post.category_icon
      },
      image: post.image_url,
      author: {
        name: post.author_name,
        email: post.author_email
      },
      tags: post.tags_array,
      featured: post.featured,
      published: post.published,
      publishedAt: post.published_at,
      formattedPublishedAt: post.formatted_published_at,
      readTime: post.read_time,
      readingTimeText: post.reading_time_text,
      views: post.views_count,
      likes: post.likes_count,
      comments: post.comments_count,
      slug: post.slug,
      createdAt: post.created_at
    }

    if include_content
      data[:content] = post.content
      data[:metaDescription] = post.meta_description
    end

    if include_metadata
      data.merge!({
        createdBy: {
          id: post.created_by.id,
          name: "#{post.created_by.first_name} #{post.created_by.last_name}".strip,
          email: post.created_by.email
        },
        updatedBy: post.updated_by ? {
          id: post.updated_by.id,
          name: "#{post.updated_by.first_name} #{post.updated_by.last_name}".strip,
          email: post.updated_by.email
        } : nil,
        updatedAt: post.updated_at
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