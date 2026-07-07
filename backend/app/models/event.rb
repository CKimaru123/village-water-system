class Event < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  has_many :event_rsvps, dependent: :destroy

  validates :title, presence: true
  validates :event_date, presence: true
  validates :event_type, presence: true

  scope :upcoming, -> { where('event_date >= ?', Time.current).order(event_date: :asc) }
  scope :past, -> { where('event_date < ?', Time.current).order(event_date: :desc) }
  scope :published, -> { where(status: 'published') }
end
