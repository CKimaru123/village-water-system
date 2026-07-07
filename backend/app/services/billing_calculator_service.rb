# BillingCalculatorService
#
# Calculates invoice charges based on billing mode and applies subsidies.
# Returns a hash with:
#   :line_items  - array of line item hashes ready for InvoiceLineItem.create!
#   :subtotal    - pre-subsidy total
#   :total       - post-subsidy total
#
# Supports three billing modes:
#   fixed       - flat charge regardless of consumption
#   usage_based - tiered tariff applied to consumption in m³
#   combined    - fixed base charge + usage-based top-up
class BillingCalculatorService
  def self.calculate(user, consumption_m3, billing_config, subsidy = nil)
    new(user, consumption_m3, billing_config, subsidy).calculate
  end

  def initialize(user, consumption_m3, billing_config, subsidy)
    @user           = user
    @consumption    = consumption_m3.to_f
    @billing_config = billing_config
    @subsidy        = subsidy
  end

  def calculate
    line_items = []
    subtotal   = 0.0

    mode = @billing_config&.billing_mode || 'usage_based'

    case mode
    when 'fixed'
      fixed_amt = @billing_config.fixed_amount.to_f
      line_items << {
        item_type:   'fixed_charge',
        description: 'Fixed monthly charge',
        quantity:    1,
        unit_rate:   fixed_amt,
        amount:      fixed_amt
      }
      subtotal = fixed_amt

    when 'usage_based'
      usage_items, usage_total = usage_based_line_items
      line_items.concat(usage_items)
      subtotal = usage_total

    when 'combined'
      # Fixed base charge
      fixed_amt = @billing_config.fixed_amount.to_f
      line_items << {
        item_type:   'fixed_charge',
        description: 'Fixed base charge',
        quantity:    1,
        unit_rate:   fixed_amt,
        amount:      fixed_amt
      }
      subtotal += fixed_amt

      # Usage-based top-up
      usage_items, usage_total = usage_based_line_items
      line_items.concat(usage_items)
      subtotal += usage_total

    else
      # Fallback: usage-based with default tariff
      usage_items, usage_total = usage_based_line_items
      line_items.concat(usage_items)
      subtotal = usage_total
    end

    # Apply subsidy if present and approved
    total = subtotal
    if @subsidy&.status == 'approved'
      discount = @subsidy.discount_amount(subtotal)
      if discount > 0
        line_items << {
          item_type:   'subsidy',
          description: "Subsidy: #{@subsidy.reason}",
          quantity:    1,
          unit_rate:   -discount,
          amount:      -discount
        }
        total = [subtotal - discount, 0].max.round(2)
      end
    end

    {
      line_items: line_items,
      subtotal:   subtotal.round(2),
      total:      total.round(2)
    }
  end

  private

  def usage_based_line_items
    return [[], 0.0] if @consumption <= 0

    tariff_id = @billing_config&.tariff_id
    rates = if tariff_id
              TariffRate.where(id: tariff_id).active.current
            else
              TariffRate.active.current.for_account_type(@user.account_type || 'household')
            end.order(:tier_min_usage)

    line_items  = []
    total_cost  = 0.0
    remaining   = @consumption

    rates.each do |rate|
      tier_min = rate.tier_min_usage.to_f
      tier_max = rate.tier_max_usage ? rate.tier_max_usage.to_f : Float::INFINITY

      next if @consumption <= tier_min
      next if remaining <= 0

      # How much consumption falls in this tier
      tier_capacity   = tier_max - tier_min
      tier_consumption = [remaining, tier_capacity].min
      tier_consumption = [tier_consumption, @consumption - tier_min].min
      next if tier_consumption <= 0

      cost = (tier_consumption * rate.rate_per_unit.to_f).round(2)
      # Add fixed charge only for the first tier
      cost += rate.fixed_charge.to_f if rate.tier_min_usage == 0 && rate.fixed_charge.to_f > 0

      line_items << {
        item_type:   'water_consumption',
        description: "Water consumption #{rate.tier_range} (#{tier_consumption.round(3)} m³ × KES #{rate.rate_per_unit})",
        quantity:    tier_consumption.round(3),
        unit_rate:   rate.rate_per_unit,
        amount:      cost
      }

      total_cost += cost
      remaining  -= tier_consumption
    end

    # If no tariff rates found, create a single line item with zero cost
    if line_items.empty?
      line_items << {
        item_type:   'water_consumption',
        description: "Water consumption (#{@consumption.round(3)} m³) — no tariff configured",
        quantity:    @consumption.round(3),
        unit_rate:   0,
        amount:      0
      }
    end

    [line_items, total_cost]
  end
end
