class Api::V1::DebugController < ApplicationController
  # Skip authentication for debug endpoints in development
  skip_before_action :authenticate_request, if: -> { Rails.env.development? }
  
  def users
    users = User.all.order(:created_at)
    
    render json: {
      success: true,
      summary: {
        total_users: User.count,
        clients: User.client.count,
        admins: User.admin.count,
        households: User.household.count,
        institutions: User.institution.count
      },
      users: users.map do |user|
        {
          id: user.id,
          display_name: user.display_name,
          phone: user.phone,
          email: user.email,
          account_type: user.account_type,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          # Account-specific data
          **if user.household?
            {
              first_name: user.first_name,
              last_name: user.last_name,
              village: user.village,
              plot_number: user.plot_number,
              household_size: user.household_size
            }
          elsif user.institution?
            {
              institution_name: user.institution_name,
              institution_type: user.institution_type,
              contact_person: user.contact_person
            }
          else
            {}
          end
        }
      end
    }
  end

  def latest_user
    user = User.last
    
    if user
      render json: {
        success: true,
        message: "Latest user retrieved",
        user: {
          id: user.id,
          display_name: user.display_name,
          phone: user.phone,
          email: user.email,
          account_type: user.account_type,
          role: user.role,
          created_at: user.created_at,
          all_attributes: user.attributes
        }
      }
    else
      render json: {
        success: false,
        message: "No users found"
      }
    end
  end
end