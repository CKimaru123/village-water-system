class Contact < ApplicationRecord
  # Enums for controlled values
  enum :status, { 
    pending: 'pending', 
    read: 'read', 
    replied: 'replied', 
    resolved: 'resolved' 
  }

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 },
            format: { with: /\A[a-zA-Z\s'-]+\z/, message: "must contain only letters, spaces, hyphens, and apostrophes" }
  
  validates :email, presence: true, 
            format: { with: URI::MailTo::EMAIL_REGEXP, message: "must be a valid email address" },
            length: { maximum: 255 }
  
  validates :phone, format: { with: /\A\+254[7]\d{8}\z/, message: "must be a valid Kenyan phone number in format +254XXXXXXXXX" },
            allow_blank: true
  
  validates :subject, presence: true, length: { minimum: 5, maximum: 200 }
  
  validates :message, presence: true, length: { minimum: 10, maximum: 2000 }
  
  validates :status, presence: true

  # Callbacks
  before_validation :normalize_phone_number
  before_validation :strip_whitespace
  before_save :set_default_status

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :unread, -> { where(status: 'pending') }

  # Instance methods
  def formatted_created_at
    created_at.strftime('%B %d, %Y at %I:%M %p')
  end

  def short_message
    message.length > 100 ? "#{message[0..100]}..." : message
  end

  def mark_as_read!
    update!(status: 'read')
  end

  def mark_as_replied!
    update!(status: 'replied')
  end

  def mark_as_resolved!
    update!(status: 'resolved')
  end

  private

  def normalize_phone_number
    return if phone.blank?
    
    # Remove all non-digits
    cleaned = phone.gsub(/\D/, '')
    
    # Convert to international format
    self.phone = case cleaned
                 when /\A254[7]\d{8}\z/  # Already in 254 format
                   "+#{cleaned}"
                 when /\A0[7]\d{8}\z/    # Local format (0712345678)
                   "+254#{cleaned[1..-1]}"
                 when /\A[7]\d{8}\z/     # Without leading 0 (712345678)
                   "+254#{cleaned}"
                 else
                   phone # Return original if can't normalize
                 end
  end

  def strip_whitespace
    # Strip whitespace from string fields
    self.name = name&.strip
    self.email = email&.strip&.downcase
    self.subject = subject&.strip
    self.message = message&.strip
  end

  def set_default_status
    self.status ||= 'pending'
  end
end
