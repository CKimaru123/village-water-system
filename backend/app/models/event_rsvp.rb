class EventRsvp < ApplicationRecord
  belongs_to :event
  belongs_to :user

  STATUSES = %w[attending not_attending sending_someone].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :event_id, uniqueness: { scope: :user_id, message: "already has an RSVP for this event" }
  validates :delegate_name, presence: true, if: -> { status == 'sending_someone' }
end
