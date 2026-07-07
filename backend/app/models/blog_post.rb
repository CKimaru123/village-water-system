class BlogPost < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  belongs_to :updated_by, class_name: 'User', optional: true

  # Blog Categories (matching frontend)
  CATEGORIES = {
    'water-health' => {
      name: 'Water & Health',
      description: 'Water quality, safety, and health-related topics',
      color: '#2196F3',
      icon: '💧'
    },
    'irrigation-farming' => {
      name: 'Irrigation & Farming',
      description: 'Crop irrigation and water-efficient farming methods',
      color: '#4CAF50',
      icon: '🌾'
    },
    'livestock-aquaculture' => {
      name: 'Livestock & Aquaculture',
      description: 'Animal water needs and fish farming techniques',
      color: '#FF9800',
      icon: '🐄'
    },
    'home-solutions' => {
      name: 'Home Water Solutions',
      description: 'Household water storage and conservation',
      color: '#9C27B0',
      icon: '🏠'
    },
    'trees-agroforestry' => {
      name: 'Trees & Agroforestry',
      description: 'Tree planting and sustainable land management',
      color: '#8BC34A',
      icon: '🌳'
    },
    'tools-materials' => {
      name: 'Water Tools & Materials',
      description: 'Equipment guides and DIY projects',
      color: '#607D8B',
      icon: '🛠️'
    },
    'weather-climate' => {
      name: 'Weather & Climate',
      description: 'Weather updates and climate change information',
      color: '#00BCD4',
      icon: '🌤️'
    },
    'government-policy' => {
      name: 'Government & Policy',
      description: 'Water policies and regulatory updates',
      color: '#3F51B5',
      icon: '🏛️'
    },
    'community-culture' => {
      name: 'Community & Culture',
      description: 'Cultural practices and community stories',
      color: '#E91E63',
      icon: '⛪'
    },
    'harvesting-storage' => {
      name: 'Water Harvesting & Storage',
      description: 'Rainwater collection and storage systems',
      color: '#009688',
      icon: '💧'
    },
    'sustainability' => {
      name: 'Sustainability & Environment',
      description: 'Environmental conservation and green practices',
      color: '#689F38',
      icon: '🌱'
    }
  }.freeze

  # Validations
  validates :title, presence: true, length: { minimum: 5, maximum: 200 }
  validates :excerpt, presence: true, length: { minimum: 20, maximum: 500 }
  validates :content, presence: true, length: { minimum: 100 }
  validates :category_id, presence: true, inclusion: { in: CATEGORIES.keys }
  validates :image_url, presence: true, format: { 
    with: /\A(https?:\/\/.*|data:image\/.*)/i, 
    message: "must be a valid HTTP/HTTPS URL or data URL" 
  }
  validates :author_name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :author_email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9\-]+\z/ }
  validates :read_time, presence: true, numericality: { greater_than: 0 }
  validates :views_count, numericality: { greater_than_or_equal_to: 0 }
  validates :likes_count, numericality: { greater_than_or_equal_to: 0 }
  validates :comments_count, numericality: { greater_than_or_equal_to: 0 }

  # Scopes
  scope :published, -> { where(published: true) }
  scope :featured, -> { where(featured: true) }
  scope :by_category, ->(category_id) { where(category_id: category_id) }
  scope :search, ->(term) { where('title ILIKE ? OR excerpt ILIKE ? OR content ILIKE ? OR tags ILIKE ?', "%#{term}%", "%#{term}%", "%#{term}%", "%#{term}%") }
  scope :recent, -> { order(published_at: :desc, created_at: :desc) }
  scope :popular, -> { order(views_count: :desc) }
  scope :most_liked, -> { order(likes_count: :desc) }
  scope :by_author, ->(author) { where('author_name ILIKE ?', "%#{author}%") }

  # Callbacks
  before_validation :generate_slug, :calculate_read_time, :process_tags
  before_save :set_published_at

  # Blog Categories (matching frontend)
  CATEGORIES = {
    'water-health' => {
      name: 'Water & Health',
      description: 'Water quality, safety, and health-related topics',
      color: '#2196F3',
      icon: '💧'
    },
    'irrigation-farming' => {
      name: 'Irrigation & Farming',
      description: 'Crop irrigation and water-efficient farming methods',
      color: '#4CAF50',
      icon: '🌾'
    },
    'livestock-aquaculture' => {
      name: 'Livestock & Aquaculture',
      description: 'Animal water needs and fish farming techniques',
      color: '#FF9800',
      icon: '🐄'
    },
    'home-solutions' => {
      name: 'Home Water Solutions',
      description: 'Household water storage and conservation',
      color: '#9C27B0',
      icon: '🏠'
    },
    'trees-agroforestry' => {
      name: 'Trees & Agroforestry',
      description: 'Tree planting and sustainable land management',
      color: '#8BC34A',
      icon: '🌳'
    },
    'tools-materials' => {
      name: 'Water Tools & Materials',
      description: 'Equipment guides and DIY projects',
      color: '#607D8B',
      icon: '🛠️'
    },
    'weather-climate' => {
      name: 'Weather & Climate',
      description: 'Weather updates and climate change information',
      color: '#00BCD4',
      icon: '🌤️'
    },
    'government-policy' => {
      name: 'Government & Policy',
      description: 'Water policies and regulatory updates',
      color: '#3F51B5',
      icon: '🏛️'
    },
    'community-culture' => {
      name: 'Community & Culture',
      description: 'Cultural practices and community stories',
      color: '#E91E63',
      icon: '⛪'
    },
    'harvesting-storage' => {
      name: 'Water Harvesting & Storage',
      description: 'Rainwater collection and storage systems',
      color: '#009688',
      icon: '💧'
    },
    'sustainability' => {
      name: 'Sustainability & Environment',
      description: 'Environmental conservation and green practices',
      color: '#689F38',
      icon: '🌱'
    }
  }.freeze

  def self.categories
    CATEGORIES
  end

  def self.category_ids
    CATEGORIES.keys
  end

  def category_info
    CATEGORIES[category_id] || {}
  end

  def category_name
    category_info[:name] || category_id.humanize
  end

  def category_color
    category_info[:color] || '#666666'
  end

  def category_icon
    category_info[:icon] || '📝'
  end

  def tags_array
    return [] if tags.blank?
    tags.split(',').map(&:strip).reject(&:blank?)
  end

  def tags_array=(array)
    self.tags = array.join(', ')
  end

  def increment_views!
    increment!(:views_count)
  end

  def increment_likes!
    increment!(:likes_count)
  end

  def formatted_published_at
    return 'Draft' unless published_at
    published_at.strftime('%B %d, %Y')
  end

  def reading_time_text
    "#{read_time} min read"
  end

  def published?
    published && published_at.present?
  end

  def to_param
    slug
  end

  private

  def generate_slug
    return if slug.present?
    
    base_slug = title.to_s.downcase
                     .gsub(/[^a-z0-9\s\-]/, '') # Remove special characters
                     .gsub(/\s+/, '-')          # Replace spaces with hyphens
                     .gsub(/-+/, '-')           # Replace multiple hyphens with single
                     .strip
                     .gsub(/^-|-$/, '')         # Remove leading/trailing hyphens
    
    # Ensure uniqueness
    counter = 1
    test_slug = base_slug
    while BlogPost.exists?(slug: test_slug)
      test_slug = "#{base_slug}-#{counter}"
      counter += 1
    end
    
    self.slug = test_slug
  end

  def calculate_read_time
    return if content.blank?
    
    # Average reading speed: 200 words per minute
    word_count = content.split.length
    self.read_time = [(word_count / 200.0).ceil, 1].max
  end

  def process_tags
    if tags.present?
      self.tags = tags.split(',').map(&:strip).reject(&:blank?).uniq.join(', ')
    end
  end

  def set_published_at
    if published && published_at.blank?
      self.published_at = Time.current
    elsif !published
      self.published_at = nil
    end
  end
end