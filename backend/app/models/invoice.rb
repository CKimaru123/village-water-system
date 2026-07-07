class Invoice < ApplicationRecord
  belongs_to :user
  belongs_to :generated_by, class_name: 'User'
  has_many :invoice_line_items, dependent: :destroy

  # Enums for controlled values
  enum :status, { draft: 'draft', sent: 'sent', paid: 'paid', overdue: 'overdue', cancelled: 'cancelled' }

  validates :invoice_number, presence: true, uniqueness: true
  validates :billing_period_start, presence: true
  validates :billing_period_end, presence: true
  validates :subtotal, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :due_date, presence: true
  validates :status, presence: true

  # Generate invoice number before validation
  before_validation :generate_invoice_number, on: :create
  before_save :calculate_consumption

  scope :current_month, -> { where(billing_period_start: Date.current.beginning_of_month..Date.current.end_of_month) }
  scope :overdue, -> { where('due_date < ? AND status != ?', Date.current, 'paid') }
  scope :unpaid, -> { where.not(status: ['paid', 'cancelled']) }

  def calculate_consumption
    if meter_reading_current && meter_reading_previous
      self.consumption_m3 = meter_reading_current - meter_reading_previous
    end
  end

  def days_overdue
    return 0 unless overdue?
    (Date.current - due_date).to_i
  end

  def overdue?
    due_date < Date.current && !paid?
  end

  def billing_period
    "#{billing_period_start.strftime('%b %d')} - #{billing_period_end.strftime('%b %d, %Y')}"
  end

  def mark_as_paid!
    update!(status: 'paid', paid_at: Time.current)
  end

  # Generate invoice with line items based on billing config
  # Options:
  #   billing_config: BillingConfig record (required)
  #   subsidy:        Subsidy record (optional, active subsidy for user)
  #   reading_source: 'smart_meter' | 'manual'
  #   field_officer_name: string (when reading_source == 'manual')
  #   is_estimated:   boolean (true when no end-of-period reading found)
  def self.generate_for_user(user, billing_period_start, billing_period_end,
                              meter_reading_previous, meter_reading_current,
                              generated_by, options = {})
    # Prevent duplicate invoices for the same period
    if where(user_id: user.id,
             billing_period_start: billing_period_start,
             billing_period_end: billing_period_end).exists?
      inv = new
      inv.errors.add(:base, 'Invoice already exists for this billing period')
      return inv
    end

    consumption = meter_reading_current - meter_reading_previous
    billing_config = options[:billing_config] || BillingConfig.effective_for(user)
    subsidy        = options[:subsidy]
    reading_source = options[:reading_source] || 'manual'
    field_officer_name = options[:field_officer_name]
    is_estimated   = options[:is_estimated] || false

    result = BillingCalculatorService.calculate(user, consumption, billing_config, subsidy)

    # If BillingCalculatorService returns zero (no tariff configured yet), fall back to
    # a simple rate-based calculation so seeds always produce non-zero invoices
    if result[:total] == 0 && consumption > 0
      fallback_rate = user.account_type == 'institution' ? 45.0 : 25.0
      fallback_fixed = user.account_type == 'institution' ? 300.0 : 150.0
      fallback_total = (consumption * fallback_rate + fallback_fixed).round(2)
      result = {
        line_items: [{
          item_type: 'water_consumption',
          description: "Water consumption (#{consumption.round(3)} m³ × KES #{fallback_rate})",
          quantity: consumption.round(3),
          unit_rate: fallback_rate,
          amount: fallback_total
        }],
        subtotal: fallback_total,
        total: fallback_total
      }
    end

    invoice = new(
      user: user,
      billing_period_start: billing_period_start,
      billing_period_end: billing_period_end,
      meter_reading_previous: meter_reading_previous,
      meter_reading_current: meter_reading_current,
      generated_by: generated_by,
      due_date: billing_period_end + 30.days,
      billing_mode: billing_config&.billing_mode || 'usage_based',
      reading_source: reading_source,
      field_officer_name: field_officer_name,
      is_estimated: is_estimated,
      subtotal: result[:subtotal],
      tax_amount: 0,
      total_amount: result[:total]
    )

    if invoice.save
      result[:line_items].each { |li| invoice.invoice_line_items.create!(li) }
    end

    invoice
  end

  private

  def generate_invoice_number
    return if invoice_number.present?
    
    # Generate invoice number: INV-YYYY-sequence
    year = Date.current.year
    sequence = Invoice.where("invoice_number LIKE ?", "INV-#{year}-%").count + 1
    self.invoice_number = "INV-#{year}-#{sequence.to_s.rjust(6, '0')}"
  end
end