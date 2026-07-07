class Announcement < ApplicationRecord
  belongs_to :created_by, class_name: 'User'

  validates :title, presence: true
  validates :content, presence: true
  validates :category, presence: true

  scope :published, -> { where(published: true).where('expires_at IS NULL OR expires_at > ?', Time.current) }
  scope :recent, -> { order(published_at: :desc, created_at: :desc) }
  scope :for_audience, ->(audience) { where(target_audience: [audience, 'all']) }

  before_save :set_published_at

  private

  def set_published_at
    self.published_at = Time.current if published && published_at.nil?
  end
end
