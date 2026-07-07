class MarketplaceItem < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  belongs_to :updated_by, class_name: 'User', optional: true
  belongs_to :seller_user, class_name: 'User', optional: true

  # Categories
  CATEGORIES = [
    'Water Storage & Tanks',
    'Irrigation Equipment',
    'Pipes & Fittings',
    'Pumps & Motors',
    'Water Treatment',
    'Farm Animals',
    'Farm Products',
    'Farming Equipment',
    'Protective Gear',
    'Plumbing Services',
    'Water Testing',
    'Agricultural Loans',
    'Other Services'
  ].freeze

  # Validations
  validates :title, presence: true, length: { minimum: 5, maximum: 200 }
  validates :description, presence: true, length: { minimum: 10, maximum: 2000 }
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :seller_name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :seller_phone, presence: true, format: { with: /\A\+254[7]\d{8}\z/ }
  validates :seller_email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :location, presence: true, length: { minimum: 2, maximum: 100 }
  validates :images, presence: true
  validates :rating, numericality: { in: 0.0..5.0 }
  validates :reviews_count, numericality: { greater_than_or_equal_to: 0 }
  validates :views_count, numericality: { greater_than_or_equal_to: 0 }

  # Scopes
  scope :active, -> { where(active: true) }
  scope :featured, -> { where(featured: true) }
  scope :in_stock, -> { where(in_stock: true) }
  scope :by_category, ->(category) { where(category: category) }
  scope :by_price_range, ->(min, max) { where(price: min..max) }
  scope :by_rating, ->(min_rating) { where('rating >= ?', min_rating) }
  scope :by_location, ->(location) { where('location ILIKE ?', "%#{location}%") }
  scope :search, ->(term) { where('title ILIKE ? OR description ILIKE ? OR seller_name ILIKE ?', "%#{term}%", "%#{term}%", "%#{term}%") }
  scope :by_seller_user, ->(user_id) { where(seller_user_id: user_id) }
  scope :popular, -> { order(views_count: :desc) }
  scope :highest_rated, -> { order(rating: :desc) }
  scope :recent, -> { order(created_at: :desc) }

  scope :price_low_to_high, -> { order(:price) }
  scope :price_high_to_low, -> { order(price: :desc) }
  before_save :process_tags, :process_images, :process_specifications
  before_validation :normalize_phone_number

  def self.categories
    CATEGORIES
  end

  def images_array
    return [] if images.blank?
    JSON.parse(images)
  rescue JSON::ParserError
    []
  end

  def images_array=(array)
    self.images = array.to_json
  end

  def specifications_hash
    return {} if specifications.blank?
    JSON.parse(specifications)
  rescue JSON::ParserError
    {}
  end

  def specifications_hash=(hash)
    self.specifications = hash.to_json
  end

  def tags_array
    return [] if tags.blank?
    tags.split(',').map(&:strip).reject(&:blank?)
  end

  def tags_array=(array)
    self.tags = array.join(', ')
  end

  def formatted_price
    "KSh #{price.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse}"
  end

  def increment_views!
    increment!(:views_count)
  end

  def average_rating_stars
    '★' * rating.round + '☆' * (5 - rating.round)
  end

  def formatted_created_at
    created_at.strftime('%B %d, %Y')
  end

  private

  def normalize_phone_number
    return if seller_phone.blank?
    
    # Remove all non-digits
    cleaned = seller_phone.gsub(/\D/, '')
    
    # Convert to international format
    self.seller_phone = case cleaned
                        when /\A254[7]\d{8}\z/  # Already in 254 format
                          "+#{cleaned}"
                        when /\A0[7]\d{8}\z/    # Local format (0712345678)
                          "+254#{cleaned[1..-1]}"
                        when /\A[7]\d{8}\z/     # Without leading 0 (712345678)
                          "+254#{cleaned}"
                        else
                          seller_phone # Return original if can't normalize
                        end
  end

  def process_tags
    if tags.present?
      self.tags = tags.split(',').map(&:strip).reject(&:blank?).uniq.join(', ')
    end
  end

  def process_images
    if images.is_a?(Array)
      self.images = images.to_json
    elsif images.is_a?(String) && !images.start_with?('[')
      # Convert single image to array
      self.images = [images].to_json
    end
  end

  def process_specifications
    if specifications.is_a?(Hash)
      self.specifications = specifications.to_json
    elsif specifications.blank?
      self.specifications = {}.to_json
    end
  end
end