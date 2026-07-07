class Api::V1::PollsController < ApplicationController
  skip_before_action :authenticate_request, only: [:index, :show, :results]
  before_action :authenticate_request, only: [:vote, :create, :update, :destroy]
  before_action :authorize_admin!, only: [:create, :update, :destroy]

  # GET /api/v1/polls
  def index
    Poll.close_expired!
    polls = Poll.includes(:poll_options).recent
    polls = polls.active if params[:active] == 'true'
    render json: { success: true, data: { polls: polls.map { |p| poll_json(p) } } }
  end

  # GET /api/v1/polls/:id
  def show
    Poll.close_expired!
    poll = Poll.includes(:poll_options, :poll_votes).find(params[:id])
    render json: { success: true, data: { poll: poll_json(poll, detailed: true) } }
  end

  # GET /api/v1/polls/:id/results
  def results
    Poll.close_expired!
    poll = Poll.includes(:poll_options, :poll_votes).find(params[:id])
    total = poll.total_votes.to_f
    breakdown = poll.poll_options.map do |opt|
      count = opt.votes_count || 0
      { id: opt.id, option_text: opt.option_text, votes: count,
        percentage: total > 0 ? (count / total * 100).round(1) : 0 }
    end
    render json: { success: true, data: { poll_id: poll.id, title: poll.title,
      total_votes: total.to_i, results: breakdown, closes_at: poll.closes_at } }
  end

  # POST /api/v1/polls/:id/vote
  def vote
    poll = Poll.find(params[:id])

    if poll.user_voted?(current_user)
      return render json: { success: false, message: 'You have already voted' }, status: :unprocessable_entity
    end

    option = poll.poll_options.find_by(id: params[:poll_option_id])
    unless option
      return render json: { success: false, message: 'Invalid option' }, status: :unprocessable_entity
    end

    PollVote.create!(poll: poll, poll_option: option, user: current_user)
    CrossDashboardService.on_poll_voted(PollVote.where(poll: poll, user: current_user).last)

    render json: { success: true, message: 'Vote recorded', data: { poll: poll_json(poll.reload, detailed: true) } }, status: :created
  end

  # POST /api/v1/polls
  def create
    poll = Poll.new(poll_params.except(:options))
    poll.created_by = current_user
    poll.status ||= 'active'
    if poll.save
      # Create poll options
      if params[:poll] && params[:poll][:options].present?
        params[:poll][:options].each do |opt_text|
          poll.poll_options.create!(option_text: opt_text.strip) if opt_text.strip.present?
        end
      end
      CrossDashboardService.on_poll_created(poll, current_user)
      render json: { success: true, message: 'Poll created', data: { poll: poll_json(poll.reload) } }, status: :created
    else
      render json: { success: false, errors: poll.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/polls/:id
  def update
    poll = Poll.find(params[:id])
    if poll.update(poll_params)
      render json: { success: true, data: { poll: poll_json(poll) } }
    else
      render json: { success: false, errors: poll.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/polls/:id
  def destroy
    Poll.find(params[:id]).destroy!
    render json: { success: true, message: 'Poll deleted' }
  end

  private

  def authorize_admin!
    render json: { success: false, message: 'Unauthorized' }, status: :forbidden unless current_user&.admin? || current_user&.super_admin?
  end

  def poll_params
    params.require(:poll).permit(:title, :description, :status, :closes_at, :category, options: [])
  end

  def poll_json(poll, detailed: false)
    {
      id: poll.id, title: poll.title, description: poll.description,
      status: poll.status, closes_at: poll.closes_at,
      category: poll.try(:category),
      total_votes: poll.total_votes,
      user_voted: current_user ? poll.user_voted?(current_user) : false,
      options: poll.poll_options.map { |o| { id: o.id, option_text: o.option_text, votes_count: o.votes_count || 0 } },
      created_at: poll.created_at
    }
  end
end
