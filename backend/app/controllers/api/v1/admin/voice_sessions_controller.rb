class Api::V1::Admin::VoiceSessionsController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/voice_sessions
  def index
    sessions = VoiceSession.recent.limit(100)
    sessions = sessions.by_channel(params[:channel]) if params[:channel].present?
    sessions = sessions.where(status: params[:status])  if params[:status].present?

    stats = {
      total:        VoiceSession.count,
      active:       VoiceSession.active.count,
      completed:    VoiceSession.completed.count,
      by_channel:   VoiceSession.group(:channel).count,
      by_language:  VoiceSession.group(:language).count,
      by_outcome:   VoiceSession.where.not(outcome: nil).group(:outcome).count,
      avg_duration: VoiceSession.where.not(duration_seconds: nil).average(:duration_seconds).to_f.round(1)
    }

    render_success({
      sessions: sessions.map { |s| serialize_session(s) },
      stats:    stats
    }, 'Voice sessions retrieved')
  end

  # POST /api/v1/admin/voice_sessions
  def create
    session = VoiceSession.new(session_params)
    session.user = current_user if params[:voice_session][:user_id].blank?

    if session.save
      render_success({ session: serialize_session(session) }, 'Voice session created', :created)
    else
      render_error('Failed to create session', session.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/voice_sessions/:id
  def update
    session = VoiceSession.find(params[:id])
    if session.update(session_params)
      render_success({ session: serialize_session(session) }, 'Session updated')
    else
      render_error('Update failed', session.errors.full_messages)
    end
  rescue ActiveRecord::RecordNotFound
    render_error('Session not found', [], :not_found)
  end

  # GET /api/v1/admin/voice_sessions/stats
  def stats
    daily = VoiceSession.where('started_at >= ?', 30.days.ago)
                        .group("date(started_at)")
                        .count
                        .map { |d, c| { date: d, count: c } }

    render_success({
      daily_trend:  daily,
      total:        VoiceSession.count,
      active:       VoiceSession.active.count,
      by_channel:   VoiceSession.group(:channel).count,
      by_language:  VoiceSession.group(:language).count,
      by_outcome:   VoiceSession.where.not(outcome: nil).group(:outcome).count,
      avg_duration: VoiceSession.where.not(duration_seconds: nil).average(:duration_seconds).to_f.round(1)
    }, 'Voice session stats retrieved')
  end

  private

  def session_params
    params.require(:voice_session).permit(
      :user_id, :language, :channel, :status, :transcript,
      :intent_detected, :caller_number, :duration_seconds,
      :outcome, :ticket_id, :started_at, :ended_at
    )
  end

  def serialize_session(s)
    {
      id:               s.id,
      session_token:    s.session_token,
      user_id:          s.user_id,
      user_name:        s.user&.display_name,
      language:         s.language,
      channel:          s.channel,
      status:           s.status,
      intent_detected:  s.intent_detected,
      caller_number:    s.caller_number,
      duration_seconds: s.duration_seconds,
      outcome:          s.outcome,
      ticket_id:        s.ticket_id,
      started_at:       s.started_at,
      ended_at:         s.ended_at,
      transcript:       s.transcript_array
    }
  end

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
