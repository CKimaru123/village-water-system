class PollOption < ApplicationRecord
  belongs_to :poll
  has_many :poll_votes, dependent: :destroy

  validates :option_text, presence: true

  def vote_percentage(total)
    return 0 if total.zero?
    ((votes_count.to_f / total) * 100).round(1)
  end
end
