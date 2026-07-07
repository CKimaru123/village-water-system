class PollVote < ApplicationRecord
  belongs_to :poll
  belongs_to :poll_option
  belongs_to :user

  validates :user_id, uniqueness: { scope: :poll_id, message: 'has already voted in this poll' }

  after_create :increment_option_count
  after_destroy :decrement_option_count

  private

  def increment_option_count
    poll_option.increment!(:votes_count)
  end

  def decrement_option_count
    poll_option.decrement!(:votes_count)
  end
end
