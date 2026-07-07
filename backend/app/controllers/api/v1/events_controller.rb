class Api::V1::EventsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show]
  before_action :authenticate_request, only: [:create, :update, :destroy]
  before_action :authorize_admin!, only: [:create, :update, :destroy]

  # GET /api/v1/events
  def index
    events = Event.published.includes(:event_rsvps)
    events = params[:past] == 'true' ? events.past : events.upcoming
    events = events.where(event_type: params[:event_type]) if params[:event_type].present?
    events = events.limit(params[:limit] || 20)

    render json: { success: true, data: { events: events.map { |e| event_json(e) } } }
  end

  # GET /api/v1/events/:id
  def show
    event = Event.find(params[:id])
    render json: { success: true, data: { event: event_json(event) } }
  end

  # POST /api/v1/events
  def create
    event = Event.new(event_params)
    event.created_by = current_user
    if event.save
      CrossDashboardService.on_event_created(event, current_user)
      render json: { success: true, message: 'Event created', data: { event: event_json(event) } }, status: :created
    else
      render json: { success: false, errors: event.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/events/:id
  def update
    event = Event.find(params[:id])
    if event.update(event_params)
      render json: { success: true, data: { event: event_json(event) } }
    else
      render json: { success: false, errors: event.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/events/:id
  def destroy
    Event.find(params[:id]).destroy!
    render json: { success: true, message: 'Event deleted' }
  end

  private

  def authorize_admin!
    render json: { success: false, message: 'Unauthorized' }, status: :forbidden unless current_user&.admin? || current_user&.super_admin?
  end

  def event_params
    params.require(:event).permit(:title, :description, :event_date, :event_type, :location, :max_attendees, :status)
  end

  def event_json(e)
    rsvp = current_user ? e.event_rsvps.find_by(user_id: current_user.id) : nil
    rsvp_counts = e.event_rsvps.group(:status).count
    {
      id: e.id, title: e.title, description: e.description,
      event_date: e.event_date, event_type: e.event_type,
      location: e.location, max_attendees: e.max_attendees,
      status: e.status, created_at: e.created_at,
      rsvp_counts: rsvp_counts,
      user_rsvp: rsvp ? { status: rsvp.status, delegate_name: rsvp.delegate_name, delegate_contact: rsvp.delegate_contact } : nil
    }
  end
end
