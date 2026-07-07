class Api::V1::TreePlantingsController < ApplicationController
  before_action :authenticate_request
  before_action :set_tree_planting, only: [:show, :update, :destroy, :add_growth_update]

  UPLOAD_DIR_BASE = Rails.root.join("storage", "tree_plantings").freeze
  MAX_PHOTO_SIZE  = 15.megabytes
  ALLOWED_FORMATS = %w[jpg jpeg png webp].freeze

  # GET /api/v1/tree_plantings — client gets their own; admin gets all
  def index
    records = if admin?
                TreePlanting.includes(:user, :tree_planting_photos, :tree_growth_updates).recent
              else
                current_user.tree_plantings.includes(:tree_planting_photos, :tree_growth_updates).recent
              end

    records = records.where(status: params[:status]) if params[:status].present?

    render_success({
      tree_plantings: records.map { |r| tree_json(r) },
      summary: {
        total_records:  records.size,
        total_trees:    records.sum(:quantity),
        verified_trees: records.verified.sum(:quantity),
        total_carbon_kg: records.verified.sum(:carbon_credit_kg).to_f.round(2)
      }
    }, "Tree plantings retrieved")
  end

  # GET /api/v1/tree_plantings/:id
  def show
    render_success({ tree_planting: tree_json(@tp, detailed: true) }, "Tree planting retrieved")
  end

  # POST /api/v1/tree_plantings — submit a new tree planting record
  def create
    tp = current_user.tree_plantings.build(tree_params)

    unless tp.save
      return render_error("Failed to save tree planting", tp.errors.full_messages)
    end

    # Handle photo uploads (multiple files via params[:photos])
    photos = extract_photos
    photos.each_with_index do |file, idx|
      result = save_photo(file, tp.id, current_user.id, "initial")
      next unless result
      tp.tree_planting_photos.create!(
        file_name:   result[:file_name],
        file_path:   result[:file_path],
        file_size:   result[:file_size],
        file_format: result[:file_format],
        photo_type:  "initial",
        caption:     "Photo #{idx + 1}",
        taken_on:    Date.current
      )
    end

    render_success({ tree_planting: tree_json(tp, detailed: true) },
                   "Tree planting submitted for verification", :created)
  end

  # PATCH /api/v1/tree_plantings/:id — update text fields or add more photos
  def update
    unless @tp.user_id == current_user.id || admin?
      return render_error("Not authorized", [], :forbidden)
    end

    @tp.update(tree_params)

    photos = extract_photos
    photos.each_with_index do |file, idx|
      result = save_photo(file, @tp.id, current_user.id, "growth_update")
      next unless result
      @tp.tree_planting_photos.create!(
        file_name:   result[:file_name],
        file_path:   result[:file_path],
        file_size:   result[:file_size],
        file_format: result[:file_format],
        photo_type:  "growth_update",
        caption:     params[:photo_caption] || "Growth update",
        taken_on:    Date.current
      )
    end

    render_success({ tree_planting: tree_json(@tp, detailed: true) }, "Tree planting updated")
  end

  # POST /api/v1/tree_plantings/:id/growth_update — monthly growth update
  def add_growth_update
    unless @tp.user_id == current_user.id || admin?
      return render_error("Not authorized", [], :forbidden)
    end

    # Check: only one update per month per record
    month_start = Date.current.beginning_of_month
    if @tp.tree_growth_updates.where("update_date >= ?", month_start).exists?
      return render_error("A growth update for this month has already been submitted.")
    end

    gu = @tp.tree_growth_updates.build(
      user:          current_user,
      update_date:   params[:update_date]&.to_date || Date.current,
      height_cm:     params[:height_cm],
      health_status: params[:health_status] || "healthy",
      trees_alive:   params[:trees_alive] || @tp.quantity,
      notes:         params[:notes]
    )

    unless gu.save
      return render_error("Failed to save growth update", gu.errors.full_messages)
    end

    # Handle optional photo upload with the growth update
    photos = extract_photos
    photos.each do |file|
      result = save_photo(file, @tp.id, current_user.id, "growth_update")
      next unless result
      @tp.tree_planting_photos.create!(
        file_name:   result[:file_name],
        file_path:   result[:file_path],
        file_size:   result[:file_size],
        file_format: result[:file_format],
        photo_type:  "growth_update",
        caption:     "Growth update #{gu.update_date}",
        taken_on:    gu.update_date
      )
    end

    render_success({ growth_update: growth_json(gu) }, "Growth update recorded")
  end

  # GET /api/v1/tree_plantings/:id/photos/:photo_id — serve photo
  def serve_photo
    @tp = TreePlanting.find(params[:id])
    unless @tp.user_id == current_user.id || admin?
      return render_error("Not authorized", [], :forbidden)
    end
    photo = @tp.tree_planting_photos.find(params[:photo_id])
    if File.exist?(photo.file_path)
      send_file photo.file_path, type: "image/#{photo.file_format}", disposition: "inline"
    else
      render_error("Photo file not found", [], :not_found)
    end
  end

  # PATCH /api/v1/tree_plantings/:id/verify  (admin only)
  def verify
    return render_error("Admin only", [], :forbidden) unless admin?
    @tp = TreePlanting.find(params[:id])
    @tp.verify!(current_user, params[:notes])
    render_success({ tree_planting: tree_json(@tp) }, "Tree planting verified")
  end

  # PATCH /api/v1/tree_plantings/:id/reject  (admin only)
  def reject
    return render_error("Admin only", [], :forbidden) unless admin?
    @tp = TreePlanting.find(params[:id])
    return render_error("Rejection reason required") if params[:reason].blank?
    @tp.reject!(current_user, params[:reason])
    render_success({ tree_planting: tree_json(@tp) }, "Tree planting rejected")
  end

  # DELETE /api/v1/tree_plantings/:id
  def destroy
    unless @tp.user_id == current_user.id || admin?
      return render_error("Not authorized", [], :forbidden)
    end
    # Delete all associated photos from disk
    @tp.tree_planting_photos.each do |p|
      File.delete(p.file_path) rescue nil
    end
    @tp.destroy
    render_success({}, "Tree planting record deleted")
  end

  private

  def set_tree_planting
    @tp = if admin?
            TreePlanting.find(params[:id])
          else
            current_user.tree_plantings.find(params[:id])
          end
  rescue ActiveRecord::RecordNotFound
    render_error("Record not found", [], :not_found)
  end

  def tree_params
    params.permit(:tree_type, :category, :species, :quantity, :water_need, :location, :notes)
  end

  def extract_photos
    # Accept photos[] array or single photo param
    raw = params[:photos]
    return [raw].compact if raw && !raw.is_a?(Array)
    Array(raw).compact
  end

  def save_photo(file, tree_id, user_id, photo_type)
    return nil unless file.respond_to?(:original_filename)

    format = File.extname(file.original_filename).delete(".").downcase
    return nil unless ALLOWED_FORMATS.include?(format)
    return nil if file.size > MAX_PHOTO_SIZE

    dir = UPLOAD_DIR_BASE.join(user_id.to_s, tree_id.to_s)
    FileUtils.mkdir_p(dir)

    timestamp = Time.current.to_i
    safe_name = file.original_filename.gsub(/[^a-zA-Z0-9._-]/, "_")
    filename  = "#{timestamp}_#{photo_type}_#{safe_name}"
    path      = dir.join(filename)

    File.open(path, "wb") { |f| f.write(file.read) }

    { file_name: filename, file_path: path.to_s, file_size: file.size, file_format: format }
  rescue => e
    Rails.logger.error "Tree photo save error: #{e.message}"
    nil
  end

  def admin?
    current_user&.admin? || current_user&.super_admin?
  end

  def tree_json(tp, detailed: false)
    base = {
      id:           tp.id,
      user_id:      tp.user_id,
      user_name:    tp.user&.display_name,
      tree_type:    tp.tree_type,
      category:     tp.category,
      species:      tp.species,
      quantity:     tp.quantity,
      water_need:   tp.water_need,
      location:     tp.location,
      notes:        tp.notes,
      status:       tp.status,
      carbon_credit_kg: tp.carbon_credit_kg.to_f,
      trees_alive:  tp.trees_currently_alive,
      created_at:   tp.created_at,
      verified_at:  tp.verified_at,
      rejection_reason: tp.rejection_reason,
      photos: tp.tree_planting_photos.order(created_at: :asc).map { |p| photo_json(p, tp) },
    }
    if detailed
      base[:growth_updates] = tp.tree_growth_updates.order(update_date: :desc).map { |g| growth_json(g) }
    end
    base
  end

  def photo_json(p, tp)
    {
      id:          p.id,
      photo_type:  p.photo_type,
      file_name:   p.file_name,
      file_format: p.file_format,
      file_size:   p.file_size,
      caption:     p.caption,
      taken_on:    p.taken_on,
      url:         "/api/v1/tree_plantings/#{tp.id}/photos/#{p.id}",
      created_at:  p.created_at,
    }
  end

  def growth_json(g)
    {
      id:            g.id,
      update_date:   g.update_date,
      height_cm:     g.height_cm,
      health_status: g.health_status,
      trees_alive:   g.trees_alive,
      notes:         g.notes,
      created_at:    g.created_at,
    }
  end
end
