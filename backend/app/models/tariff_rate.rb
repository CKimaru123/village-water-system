class TariffRate < ApplicationRecord
  # Enums for controlled values
  enum :account_type, { household: 'household', institution: 'institution' }

  validates :rate_name, presence: true
  validates :account_type, presence: true
  validates :tier_min_usage, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :tier_max_usage, numericality: { greater_than: :tier_min_usage }, allow_nil: true
  validates :rate_per_unit, presence: true, numericality: { greater_than: 0 }
  validates :fixed_charge, numericality: { greater_than_or_equal_to: 0 }
  validates :effective_date, presence: true

  scope :active, -> { where(is_active: true) }
  scope :current, -> { where('effective_date <= ? AND (expiry_date IS NULL OR expiry_date >= ?)', Date.current, Date.current) }
  scope :for_account_type, ->(type) { where(account_type: type) }

  # Get applicable rate for consumption amount
  def self.calculate_cost(account_type, consumption_m3)
    rates = active.current.for_account_type(account_type).order(:tier_min_usage)
    total_cost = 0
    remaining_consumption = consumption_m3

    rates.each do |rate|
      # Calculate consumption in this tier
      tier_min = rate.tier_min_usage
      tier_max = rate.tier_max_usage || Float::INFINITY
      
      if remaining_consumption > 0 && consumption_m3 > tier_min
        tier_consumption = [remaining_consumption, tier_max - tier_min].min
        tier_consumption = [tier_consumption, consumption_m3 - tier_min].min
        
        if tier_consumption > 0
          total_cost += tier_consumption * rate.rate_per_unit
          total_cost += rate.fixed_charge if rate.tier_min_usage == 0 # Add fixed charge only for first tier
          remaining_consumption -= tier_consumption
        end
      end
    end

    total_cost
  end

  def tier_range
    if tier_max_usage
      "#{tier_min_usage} - #{tier_max_usage} m³"
    else
      "#{tier_min_usage}+ m³"
    end
  end

  def active?
    is_active && 
    effective_date <= Date.current && 
    (expiry_date.nil? || expiry_date >= Date.current)
  end
end