class Project < ApplicationRecord
  belongs_to :created_by, class_name: 'User'

  validates :title, presence: true
  validates :status, presence: true

  scope :ongoing, -> { where(status: 'ongoing') }
  scope :completed, -> { where(status: 'completed') }
  scope :recent, -> { order(created_at: :desc) }
  scope :with_coordinates, -> { where.not(gps_latitude: nil) }
end
