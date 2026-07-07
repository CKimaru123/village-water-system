class TreePlantingPhoto < ApplicationRecord
  belongs_to :tree_planting

  PHOTO_TYPES    = %w[initial growth_update verification].freeze
  ALLOWED_FORMATS = %w[jpg jpeg png webp].freeze

  validates :file_name,   presence: true
  validates :file_path,   presence: true
  validates :file_size,   numericality: { greater_than: 0, less_than_or_equal_to: 15.megabytes }
  validates :file_format, inclusion: { in: ALLOWED_FORMATS }
  validates :photo_type,  inclusion: { in: PHOTO_TYPES }
end
