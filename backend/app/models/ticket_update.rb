class TicketUpdate < ApplicationRecord
  belongs_to :ticket
  belongs_to :user

  validates :message, presence: true

  scope :public_updates, -> { where(is_internal: false) }
  scope :recent, -> { order(created_at: :asc) }
end
