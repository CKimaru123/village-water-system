class TreePlanting < ApplicationRecord
  belongs_to :user
  belongs_to :verified_by, class_name: "User", foreign_key: :verified_by_id, optional: true
  has_many :tree_planting_photos, dependent: :destroy
  has_many :tree_growth_updates, dependent: :destroy

  TREE_TYPES  = %w[indigenous exotic].freeze
  CATEGORIES  = %w[fruit timber shade heritage medicinal agroforestry].freeze
  STATUSES    = %w[pending verified rejected].freeze
  WATER_NEEDS = %w[low medium high].freeze

  # kg CO2 absorbed per tree per year (IPCC estimate for tropical trees)
  CARBON_PER_TREE_PER_YEAR = 21.0

  validates :tree_type, inclusion: { in: TREE_TYPES }
  validates :category,  inclusion: { in: CATEGORIES }
  validates :species,   presence: true
  validates :quantity,  numericality: { greater_than: 0 }
  validates :status,    inclusion: { in: STATUSES }

  scope :pending,  -> { where(status: "pending") }
  scope :verified, -> { where(status: "verified") }
  scope :recent,   -> { order(created_at: :desc) }

  def verify!(admin, notes = nil)
    credit = (quantity * CARBON_PER_TREE_PER_YEAR).round(3)
    update!(
      status: "verified",
      verified_by_id: admin.id,
      verified_at: Time.current,
      carbon_credit_kg: credit
    )
    # Notify client
    Notification.create!(
      user: user,
      title: "Tree Planting Verified ✅",
      message: "Your record of #{quantity} #{species} tree(s) has been verified. You've earned #{credit} kg CO₂ credit.",
      category: "general", notification_type: "tree_verified", priority: "normal",
      action_url: "/client/carbon-footprint"
    ) rescue nil
  end

  def reject!(admin, reason)
    update!(
      status: "rejected",
      verified_by_id: admin.id,
      verified_at: Time.current,
      rejection_reason: reason
    )
    Notification.create!(
      user: user,
      title: "Tree Planting Record Needs Update",
      message: "Your tree planting record was not verified: #{reason}. Please resubmit with clearer photos.",
      category: "general", notification_type: "tree_rejected", priority: "normal",
      action_url: "/client/carbon-footprint"
    ) rescue nil
  end

  def latest_photo
    tree_planting_photos.order(created_at: :desc).first
  end

  def latest_growth
    tree_growth_updates.order(update_date: :desc).first
  end

  def trees_currently_alive
    latest_growth&.trees_alive || quantity
  end
end
