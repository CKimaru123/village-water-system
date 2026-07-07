class BillingConfig < ApplicationRecord
  belongs_to :user,       optional: true   # null = global default
  belongs_to :tariff,     class_name: 'TariffRate', foreign_key: :tariff_id, optional: true
  belongs_to :created_by, class_name: 'User', foreign_key: :created_by_id, optional: true

  BILLING_MODES = %w[fixed usage_based combined].freeze

  validates :billing_mode, presence: true, inclusion: { in: BILLING_MODES }
  validates :effective_from, presence: true
  validates :fixed_amount,
            numericality: { greater_than: 0 },
            if: -> { billing_mode.in?(%w[fixed combined]) }
  validates :tariff_id,
            presence: true,
            if: -> { billing_mode.in?(%w[usage_based combined]) }
  validate  :only_one_global_default, if: -> { user_id.nil? }
  validate  :only_one_per_user,       if: -> { user_id.present? }

  scope :global_default, -> { where(user_id: nil).order(effective_from: :desc) }
  scope :for_user,       ->(uid) { where(user_id: uid).order(effective_from: :desc) }

  # Returns the effective config for a user: per-user override first, then global default
  def self.effective_for(user)
    for_user(user.id).first || global_default.first
  end

  def global?
    user_id.nil?
  end

  private

  def only_one_global_default
    existing = BillingConfig.where(user_id: nil)
    existing = existing.where.not(id: id) if persisted?
    errors.add(:base, 'A global default billing config already exists. Update it instead of creating a new one.') if existing.exists?
  end

  def only_one_per_user
    existing = BillingConfig.where(user_id: user_id)
    existing = existing.where.not(id: id) if persisted?
    errors.add(:user, 'already has a billing config. Update it instead of creating a new one.') if existing.exists?
  end
end
