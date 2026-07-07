class Api::V1::AdminManagementController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin_or_super, only: [:index, :show]  # all admins can view
  before_action :ensure_super_admin, except: [:index, :show]   # only super admin can mutate
  before_action :set_user, only: [:show, :update, :destroy, :promote_to_admin, :demote_to_client, :suspend, :activate]

  # GET /api/v1/admin_management/users
  def index
    @users = User.includes(:user_profile).all.order(:role, :created_at)
    
    # Apply filters
    @users = @users.where(role: params[:role]) if params[:role].present?
    @users = @users.where(status: params[:status]) if params[:status].present?
    @users = @users.where("phone LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR institution_name LIKE ? OR email LIKE ?", 
                         "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%", "%#{params[:search]}%") if params[:search].present?
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = [params[:per_page]&.to_i || 20, 50].min
    
    @users = @users.limit(per_page).offset((page - 1) * per_page)
    
    render_success({
      users: @users.map { |user| user_data(user) },
      pagination: {
        page: page,
        per_page: per_page,
        total: User.count
      },
      stats: {
        total_users: User.count,
        clients: User.client.count,
        admins: User.admin.count,
        super_admins: User.super_admin.count,
        active: User.active.count,
        inactive: User.inactive.count,
        suspended: User.suspended.count
      }
    }, 'Users retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Admin management index error: #{e.message}"
    render_error('Unable to retrieve users.')
  end

  # GET /api/v1/admin_management/users/:id
  def show
    render_success({
      user: user_data(@user, include_details: true)
    }, 'User retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Admin management show error: #{e.message}"
    render_error('Unable to retrieve user.')
  end

  # POST /api/v1/admin_management/users
  def create
    @user = User.new(user_params)
    @user.status = 'active'
    
    if @user.save
      render_success({
        user: user_data(@user, include_details: true)
      }, 'User created successfully', :created)
    else
      render_error('Failed to create user', @user.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Admin management creation error: #{e.message}"
    render_error('An error occurred while creating user.')
  end

  # PATCH/PUT /api/v1/admin_management/users/:id
  def update
    if @user.update(user_params)
      render_success({
        user: user_data(@user, include_details: true)
      }, 'User updated successfully')
    else
      render_error('Failed to update user', @user.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Admin management update error: #{e.message}"
    render_error('An error occurred while updating user.')
  end

  # DELETE /api/v1/admin_management/users/:id
  def destroy
    # Prevent deletion of the last super admin
    if @user.super_admin? && User.super_admin.count <= 1
      render_error('Cannot delete the last super admin.')
      return
    end
    
    # Prevent self-deletion
    if @user.id == current_user.id
      render_error('Cannot delete your own account.')
      return
    end
    
    @user.destroy!
    render_success({}, 'User deleted successfully')
  rescue StandardError => e
    Rails.logger.error "Admin management delete error: #{e.message}"
    render_error('Unable to delete user.')
  end

  # POST /api/v1/admin_management/users/:id/promote_to_admin
  def promote_to_admin
    if @user.client?
      @user.update!(role: 'admin')
      render_success({
        user: user_data(@user, include_details: true)
      }, 'User promoted to admin successfully')
    else
      render_error('User is already an admin or super admin.')
    end
  rescue StandardError => e
    Rails.logger.error "Admin promotion error: #{e.message}"
    render_error('Unable to promote user.')
  end

  # POST /api/v1/admin_management/users/:id/demote_to_client
  def demote_to_client
    if @user.admin?
      @user.update!(role: 'client')
      render_success({
        user: user_data(@user, include_details: true)
      }, 'User demoted to client successfully')
    else
      render_error('User is not an admin or cannot be demoted.')
    end
  rescue StandardError => e
    Rails.logger.error "Admin demotion error: #{e.message}"
    render_error('Unable to demote user.')
  end

  # POST /api/v1/admin_management/users/:id/suspend
  def suspend
    @user.update!(status: 'suspended')
    render_success({
      user: user_data(@user, include_details: true)
    }, 'User suspended successfully')
  rescue StandardError => e
    Rails.logger.error "User suspension error: #{e.message}"
    render_error('Unable to suspend user.')
  end

  # POST /api/v1/admin_management/users/:id/activate
  def activate
    @user.update!(status: 'active')
    render_success({
      user: user_data(@user, include_details: true)
    }, 'User activated successfully')
  rescue StandardError => e
    Rails.logger.error "User activation error: #{e.message}"
    render_error('Unable to activate user.')
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(
      :phone, :email, :password, :password_confirmation, :first_name, :last_name,
      :account_type, :role, :status, :communication_preference, :alt_phone,
      :plot_number, :household_size, :village, :landmark, :institution_name,
      :institution_type, :contact_person, :population_served, :alt_contact
    )
  end

  def user_data(user, include_details: false)
    data = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      display_name: user.display_name,
      account_type: user.account_type,
      role: user.role,
      status: user.status,
      communication_preference: user.communication_preference,
      created_at: user.created_at,
      updated_at: user.updated_at,
      formatted_updated_at: user.formatted_updated_at_with_timezone,
      account_number: user.user_profile&.account_number
    }

    if include_details
      data.merge!({
        first_name: user.first_name,
        last_name: user.last_name,
        alt_phone: user.alt_phone,
        plot_number: user.plot_number,
        household_size: user.household_size,
        village: user.village,
        landmark: user.landmark,
        institution_name: user.institution_name,
        institution_type: user.institution_type,
        contact_person: user.contact_person,
        population_served: user.population_served,
        alt_contact: user.alt_contact
      })
    end

    data
  end

  def ensure_super_admin
    unless current_user&.super_admin?
      render_error('Access denied. Super admin privileges required.', [], :forbidden)
    end
  end

  def ensure_admin_or_super
    unless current_user&.admin? || current_user&.super_admin?
      render_error('Access denied.', [], :forbidden)
    end
  end
end