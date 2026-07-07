class Api::V1::EventRsvpsController < ApplicationController
  before_action :authenticate_request
  before_action :set_event

  # GET /api/v1/events/:event_id/rsvp  — get current user's RSVP
  def show
    rsvp = @event.event_rsvps.find_by(user: current_user)
    if rsvp
      render json: { success: true, data: { rsvp: rsvp_json(rsvp) } }
    else
      render json: { success: true, data: { rsvp: nil } }
    end
  end

  # POST /api/v1/events/:event_id/rsvp  — create or update RSVP
  def upsert
    rsvp = @event.event_rsvps.find_or_initialize_by(user: current_user)
    rsvp.assign_attributes(rsvp_params)
    rsvp.receipt_confirmed = true

    if rsvp.save
      render json: { success: true, message: 'RSVP saved', data: { rsvp: rsvp_json(rsvp) } }, status: :ok
    else
      render json: { success: false, errors: rsvp.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/events/:event_id/rsvps  — admin: list all RSVPs for an event
  def index
    authorize_admin!
    rsvps = @event.event_rsvps.includes(:user)
    render json: { success: true, data: { rsvps: rsvps.map { |r| rsvp_json(r, with_user: true) } } }
  end

  private

  def set_event
    @event = Event.find(params[:event_id] || params[:id])
  end

  def rsvp_params
    params.require(:rsvp).permit(:status, :delegate_name, :delegate_contact)
  end

  def authorize_admin!
    render json: { success: false, message: 'Unauthorized' }, status: :forbidden unless current_user&.admin? || current_user&.super_admin?
  end

  def rsvp_json(rsvp, with_user: false)
    data = {
      id: rsvp.id,
      status: rsvp.status,
      delegate_name: rsvp.delegate_name,
      delegate_contact: rsvp.delegate_contact,
      receipt_confirmed: rsvp.receipt_confirmed,
      updated_at: rsvp.updated_at
    }
    data[:user] = { id: rsvp.user.id, name: rsvp.user.name, email: rsvp.user.email } if with_user
    data
  end
end
