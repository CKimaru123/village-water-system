class Api::V1::ContactsController < ApplicationController
  # Skip authentication for contact form submission (public endpoint)
  skip_before_action :authenticate_request, only: [:create]
  
  before_action :set_contact, only: [:show, :update, :destroy]

  # POST /api/v1/contacts
  def create
    @contact = Contact.new(contact_params)
    
    # Add request metadata
    @contact.ip_address = request.remote_ip
    @contact.user_agent = request.user_agent
    
    Rails.logger.info "=== CONTACT FORM SUBMISSION ==="
    Rails.logger.info "Contact params: #{contact_params.inspect}"
    Rails.logger.info "IP Address: #{request.remote_ip}"
    Rails.logger.info "User Agent: #{request.user_agent}"
    
    if @contact.save
      Rails.logger.info "Contact saved successfully with ID: #{@contact.id}"
      
      # TODO: Send notification email to admin
      # ContactMailer.new_contact_notification(@contact).deliver_later
      
      render_success({
        contact: contact_data(@contact),
        message: 'Thank you for your message! We will get back to you soon.'
      }, 'Contact form submitted successfully', :created)
    else
      Rails.logger.error "Contact validation failed: #{@contact.errors.full_messages}"
      render_error('Failed to submit contact form', @contact.errors.full_messages, :unprocessable_entity)
    end
  rescue StandardError => e
    Rails.logger.error "Contact creation error: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render_error('An error occurred while submitting your message. Please try again.')
  end

  # GET /api/v1/contacts (Admin only)
  def index
    @contacts = Contact.recent.includes(:created_at)
    
    # Filter by status if provided
    @contacts = @contacts.by_status(params[:status]) if params[:status].present?
    
    # Pagination
    page = params[:page]&.to_i || 1
    per_page = params[:per_page]&.to_i || 20
    per_page = [per_page, 100].min # Max 100 per page
    
    @contacts = @contacts.limit(per_page).offset((page - 1) * per_page)
    
    render_success({
      contacts: @contacts.map { |contact| contact_data(contact) },
      pagination: {
        page: page,
        per_page: per_page,
        total: Contact.count
      }
    }, 'Contacts retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Contacts index error: #{e.message}"
    render_error('Unable to retrieve contacts.')
  end

  # GET /api/v1/contacts/:id (Admin only)
  def show
    render_success({
      contact: contact_data(@contact, include_metadata: true)
    }, 'Contact retrieved successfully')
  rescue StandardError => e
    Rails.logger.error "Contact show error: #{e.message}"
    render_error('Unable to retrieve contact.')
  end

  # PATCH/PUT /api/v1/contacts/:id (Admin only)
  def update
    if @contact.update(update_contact_params)
      render_success({
        contact: contact_data(@contact, include_metadata: true)
      }, 'Contact updated successfully')
    else
      render_error('Failed to update contact', @contact.errors.full_messages)
    end
  rescue StandardError => e
    Rails.logger.error "Contact update error: #{e.message}"
    render_error('Unable to update contact.')
  end

  # DELETE /api/v1/contacts/:id (Admin only)
  def destroy
    @contact.destroy!
    render_success({}, 'Contact deleted successfully')
  rescue StandardError => e
    Rails.logger.error "Contact delete error: #{e.message}"
    render_error('Unable to delete contact.')
  end

  private

  def set_contact
    @contact = Contact.find(params[:id])
  end

  def contact_params
    params.require(:contact).permit(:name, :email, :phone, :subject, :message)
  end

  def update_contact_params
    params.require(:contact).permit(:status)
  end

  def contact_data(contact, include_metadata: false)
    data = {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      status: contact.status,
      created_at: contact.created_at,
      formatted_created_at: contact.formatted_created_at,
      short_message: contact.short_message
    }

    if include_metadata
      data.merge!({
        ip_address: contact.ip_address,
        user_agent: contact.user_agent,
        updated_at: contact.updated_at
      })
    end

    data
  end
end
