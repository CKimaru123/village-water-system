class BlockchainRecord < ApplicationRecord
  belongs_to :created_by, class_name: 'User', optional: true

  validates :record_type,      presence: true
  validates :transaction_hash, presence: true, uniqueness: true

  before_validation :generate_hashes, on: :create

  RECORD_TYPES = %w[payment grant contract audit subsidy refund].freeze

  scope :confirmed,   -> { where(status: 'confirmed') }
  scope :pending,     -> { where(status: 'pending') }
  scope :recent,      -> { order(created_at: :desc) }
  scope :by_type,     ->(t) { where(record_type: t) }

  def metadata_hash
    return {} if metadata.blank?
    JSON.parse(metadata) rescue {}
  end

  private

  def generate_hashes
    self.transaction_hash ||= generate_tx_hash
    self.block_hash       ||= generate_block_hash
    self.block_number     ||= (BlockchainRecord.maximum(:block_number) || 1000) + 1
    self.confirmed_at     ||= Time.current
  end

  def generate_tx_hash
    require 'digest'
    payload = "#{record_type}#{reference_id}#{reference_type}#{amount}#{Time.current.to_f}#{rand(1_000_000)}"
    "0x#{Digest::SHA256.hexdigest(payload)}"
  end

  def generate_block_hash
    require 'digest'
    payload = "#{transaction_hash}#{block_number}#{Time.current.to_f}"
    "0x#{Digest::SHA256.hexdigest(payload)[0..39]}"
  end
end
