class VoiceSession < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :ticket, optional: true

  validates :session_token, presence: true, uniqueness: true

  before_validation :set_session_token, on: :create
  before_validation :set_started_at,    on: :create

  scope :active,     -> { where(status: 'active') }
  scope :completed,  -> { where(status: 'completed') }
  scope :recent,     -> { order(started_at: :desc) }
  scope :by_channel, ->(c) { where(channel: c) }

  def transcript_array
    return [] if transcript.blank?
    JSON.parse(transcript) rescue []
  end

  def append_transcript(role, text)
    arr = transcript_array
    arr << { role: role, text: text, timestamp: Time.current.iso8601 }
    update_column(:transcript, arr.to_json)
  end

  private

  def set_session_token
    self.session_token ||= SecureRandom.hex(16)
  end

  def set_started_at
    self.started_at ||= Time.current
  end
end
