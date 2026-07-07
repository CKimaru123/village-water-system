class Poll < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  has_many :poll_options, dependent: :destroy
  has_many :poll_votes, dependent: :destroy

  validates :title, presence: true
  validates :status, presence: true

  scope :active, -> { where(status: 'active').where('closes_at IS NULL OR closes_at > ?', Time.current) }
  scope :recent, -> { order(created_at: :desc) }

  # Auto-close polls whose closes_at has passed
  before_save :auto_close_if_expired

  def total_votes
    poll_votes.count
  end

  def user_voted?(user)
    poll_votes.exists?(user_id: user.id)
  end

  # Bulk-close all expired active polls without triggering callbacks
  def self.close_expired!
    where(status: 'active').where('closes_at IS NOT NULL AND closes_at < ?', Time.current)
                           .update_all(status: 'closed')
  end

  private

  def auto_close_if_expired
    self.status = 'closed' if closes_at.present? && closes_at < Time.current && status == 'active'
  end
end
