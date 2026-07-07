class Api::V1::DocumentsController < ApplicationController
  skip_before_action :authenticate_request, only: [] # override base class — require auth for all document actions
  before_action :authenticate_request, only: [:index, :pending, :me, :show, :create, :destroy, :download, :verify, :reject]
  before_action :set_document, only: [:show, :destroy, :download, :verify, :reject]
  before_action :authorize_admin!, only: [:index, :pending, :verify, :reject]

  # GET /api/v1/documents/me - Get current user's documents
  def me
    documents = current_user.documents.order(uploaded_at: :desc)
    
    render json: {
      success: true,
      data: {
        documents: documents.map { |d| document_json(d) }
      }
    }
  end

  # GET /api/v1/documents - Get all documents (admin only)
  def index
    documents = Document.includes(:user, :verified_by)
    
    # Apply filters
    documents = documents.where(user_id: params[:user_id]) if params[:user_id].present?
    documents = documents.where(status: params[:status]) if params[:status].present?
    documents = documents.where(document_type: params[:document_type]) if params[:document_type].present?
    
    # Manual pagination
    per_page = (params[:per_page] || 25).to_i.clamp(1, 100)
    page     = (params[:page] || 1).to_i.clamp(1, Float::INFINITY)
    total    = documents.count
    documents = documents.order(created_at: :desc).offset((page - 1) * per_page).limit(per_page)
    
    render json: {
      success: true,
      data: {
        documents: documents.map { |d| document_json(d, include_user: true) },
        pagination: {
          current_page:  page,
          total_pages:   (total.to_f / per_page).ceil,
          total_count:   total,
          per_page:      per_page
        }
      }
    }
  end

  # GET /api/v1/documents/pending - Get pending documents (admin only)
  def pending
    documents = Document.unverified.includes(:user).order(uploaded_at: :asc)
    
    render json: {
      success: true,
      data: {
        documents: documents.map { |d| document_json(d, include_user: true) },
        count: documents.count
      }
    }
  end

  # GET /api/v1/documents/:id - Get specific document
  def show
    render json: {
      success: true,
      data: {
        document: document_json(@document, include_user: current_user.admin? || current_user.super_admin?)
      }
    }
  end

  # POST /api/v1/documents - Upload new document
  def create
    # Handle file upload
    uploaded_file = params[:file]
    
    unless uploaded_file
      return render json: {
        success: false,
        message: 'No file provided'
      }, status: :unprocessable_entity
    end
    
    # Validate file size (10MB max)
    if uploaded_file.size > 10.megabytes
      return render json: {
        success: false,
        message: 'File size exceeds 10MB limit'
      }, status: :unprocessable_entity
    end
    
    # Validate file format
    file_format = File.extname(uploaded_file.original_filename).delete('.').downcase
    allowed_formats = %w[pdf jpg jpeg png]
    
    unless allowed_formats.include?(file_format)
      return render json: {
        success: false,
        message: "Invalid file format. Allowed formats: #{allowed_formats.join(', ')}"
      }, status: :unprocessable_entity
    end
    
    # Create directory if it doesn't exist
    upload_dir = Rails.root.join('storage', 'documents', current_user.id.to_s)
    FileUtils.mkdir_p(upload_dir) unless Dir.exist?(upload_dir)
    
    # Generate unique filename
    timestamp = Time.current.to_i
    filename = "#{timestamp}_#{uploaded_file.original_filename}"
    file_path = upload_dir.join(filename)
    
    # Save file
    File.open(file_path, 'wb') do |file|
      file.write(uploaded_file.read)
    end
    
    # Create document record
    document = current_user.documents.new(
      document_type: params[:document_type] || 'other',
      document_number: params[:document_number],
      file_name: uploaded_file.original_filename,
      file_path: file_path.to_s,
      file_size: uploaded_file.size,
      file_format: file_format,
      expiry_date: params[:expiry_date],
      notes: params[:notes]
    )
    
    if document.save
      CrossDashboardService.on_document_uploaded(document)

      render json: {
        success: true,
        message: 'Document uploaded successfully',
        data: {
          document: document_json(document)
        }
      }, status: :created
    else
      # Delete file if database save fails
      File.delete(file_path) if File.exist?(file_path)
      
      render json: {
        success: false,
        message: 'Failed to upload document',
        errors: document.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/documents/:id/download - Download document
  def download
    if File.exist?(@document.file_path)
      send_file @document.file_path, 
                filename: @document.file_name,
                type: "application/#{@document.file_format}",
                disposition: 'attachment'
    else
      render json: {
        success: false,
        message: 'File not found'
      }, status: :not_found
    end
  end

  # PATCH /api/v1/documents/:id/verify - Verify document (admin only)
  def verify
    if @document.verify!(current_user, params[:notes])
      CrossDashboardService.on_document_verified(@document, current_user)

      render json: {
        success: true,
        message: 'Document verified successfully',
        data: {
          document: document_json(@document)
        }
      }
    else
      render json: {
        success: false,
        message: 'Failed to verify document',
        errors: @document.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/documents/:id/reject - Reject document (admin only)
  def reject
    rejection_reason = params[:rejection_reason]
    
    unless rejection_reason.present?
      return render json: {
        success: false,
        message: 'Rejection reason is required'
      }, status: :unprocessable_entity
    end
    
    if @document.reject!(current_user, rejection_reason)
      CrossDashboardService.on_document_rejected(@document, current_user, rejection_reason)

      render json: {
        success: true,
        message: 'Document rejected successfully',
        data: {
          document: document_json(@document)
        }
      }
    else
      render json: {
        success: false,
        message: 'Failed to reject document',
        errors: @document.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/documents/:id - Delete document
  def destroy
    # Only allow deletion of unverified documents by owner or any document by admin
    unless @document.unverified? || current_user.admin? || current_user.super_admin?
      return render json: {
        success: false,
        message: 'Cannot delete verified documents'
      }, status: :forbidden
    end
    
    # Delete file
    File.delete(@document.file_path) if File.exist?(@document.file_path)
    
    if @document.destroy
      render json: {
        success: true,
        message: 'Document deleted successfully'
      }
    else
      render json: {
        success: false,
        message: 'Failed to delete document'
      }, status: :unprocessable_entity
    end
  end

  private

  def set_document
    @document = if current_user.admin? || current_user.super_admin?
                  Document.find(params[:id])
                else
                  current_user.documents.find(params[:id])
                end
  rescue ActiveRecord::RecordNotFound
    render json: {
      success: false,
      message: 'Document not found'
    }, status: :not_found
  end

  def authorize_admin!
    unless current_user.admin? || current_user.super_admin?
      render json: {
        success: false,
        message: 'Unauthorized access'
      }, status: :forbidden
    end
  end

  def document_json(document, include_user: false)
    data = {
      id: document.id,
      document_type: document.document_type,
      document_number: document.document_number,
      file_name: document.file_name,
      file_size: document.file_size,
      file_size_mb: document.file_size_mb,
      file_format: document.file_format,
      status: document.status,
      uploaded_at: document.uploaded_at,
      verified_at: document.verified_at,
      rejection_reason: document.rejection_reason,
      expiry_date: document.expiry_date,
      expired: document.expired?,
      expiring_soon: document.expiring_soon?,
      notes: document.notes,
      created_at: document.created_at,
      updated_at: document.updated_at
    }
    
    if include_user
      data[:user] = {
        id: document.user.id,
        name: "#{document.user.first_name} #{document.user.last_name}",
        phone: document.user.phone,
        email: document.user.email
      }
    end
    
    if document.verified_by
      data[:verified_by] = {
        id: document.verified_by.id,
        name: "#{document.verified_by.first_name} #{document.verified_by.last_name}"
      }
    end
    
    data
  end
end
