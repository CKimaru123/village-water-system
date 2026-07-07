class UserProfile < ApplicationRecord
  belongs_to :user

  validates :user_id, presence: true, uniqueness: true

  # Generate account number before creation
  before_create :generate_account_number

  private

  def generate_account_number
    return if account_number.present?
    
    # Generate account number based on user type and sequence
    prefix = user.household? ? 'HH' : 'IN'
    sequence = UserProfile.where("account_number LIKE ?", "#{prefix}%").count + 1
    self.account_number = "#{prefix}#{sequence.to_s.rjust(6, '0')}"
  end
end