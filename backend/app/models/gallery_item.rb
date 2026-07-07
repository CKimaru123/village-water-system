class GalleryItem < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  belongs_to :updated_by, class_name: 'User', optional: true

  # Validations
  validates :title, presence: true, length: { minimum: 3, maximum: 200 }
  validates :large_image_url, presence: true, format: { with: URI::regexp(%w[http https]) }
  validates :small_image_url, presence: true, format: { with: URI::regexp(%w[http https]) }
  validates :category, presence: true
  validates :sort_order, presence: true, numericality: { greater_than_or_equal_to: 0 }

  # Scopes
  scope :active, -> { where(active: true) }
  scope :featured, -> { where(featured: true) }
  scope :by_category, ->(category) { where(category: category) }
  scope :ordered, -> { order(:sort_order, :created_at) }
  scope :recent, -> { order(created_at: :desc) }

  # Callbacks
  before_validation :set_default_sort_order, on: :create
  before_save :process_tags

  # Categories
  CATEGORIES = [
    'Water Infrastructure',
    'Community Events',
    'Agricultural Projects',
    'Training Sessions',
    'Equipment Installation',
    'Environmental Conservation',
    'Success Stories',
    'Maintenance Work',
    'Partnerships',
    'Other'
  ].freeze

  def self.categories
    CATEGORIES
  end

  def tags_array
    return [] if tags.blank?
    tags.split(',').map(&:strip).reject(&:blank?)
  end

  def tags_array=(array)
    self.tags = array.join(', ')
  end

  def formatted_created_at
    created_at.strftime('%B %d, %Y')
  end

  private

  def set_default_sort_order
    self.sort_order ||= (GalleryItem.maximum(:sort_order) || 0) + 1
  end

  def process_tags
    if tags.present?
      self.tags = tags.split(',').map(&:strip).reject(&:blank?).uniq.join(', ')
    end
  end
end