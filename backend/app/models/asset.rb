class Asset < ApplicationRecord
  belongs_to :created_by, class_name: 'User', optional: true
  has_many :maintenance_schedules, dependent: :destroy
  has_many :incidents, dependent: :nullify
  has_many :energy_records, dependent: :destroy

  validates :asset_name, presence: true
  validates :asset_type, presence: true

  scope :active, -> { where(status: 'active') }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(asset_type: type) }
  scope :with_coordinates, -> { where.not(gps_latitude: nil) }
end
