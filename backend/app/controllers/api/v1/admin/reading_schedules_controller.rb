class Api::V1::Admin::ReadingSchedulesController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/reading_schedules
  def index
    global       = ReadingSchedule.global_default.first
    meter_scheds = ReadingSchedule.where.not(meter_id: nil).where(active: true).includes(:meter).order(:meter_id)

    render_success({
      global_default:  global ? schedule_json(global) : nil,
      meter_schedules: meter_scheds.map { |s| schedule_json(s) }
    }, 'Reading schedules retrieved')
  end

  # GET /api/v1/admin/reading_schedules/global
  def show_global
    schedule = ReadingSchedule.global_default.first
    if schedule
      render_success({ reading_schedule: schedule_json(schedule) }, 'Global reading schedule retrieved')
    else
      render_success({ reading_schedule: nil }, 'No global reading schedule set')
    end
  end

  # PATCH /api/v1/admin/reading_schedules/global
  def update_global
    schedule = ReadingSchedule.global_default.first

    if schedule
      if schedule.update(schedule_params)
        render_success({ reading_schedule: schedule_json(schedule) }, 'Global reading schedule updated')
      else
        render_error('Failed to update global reading schedule', schedule.errors.full_messages)
      end
    else
      schedule = ReadingSchedule.new(schedule_params.merge(meter_id: nil, created_by_id: current_user.id))
      if schedule.save
        render_success({ reading_schedule: schedule_json(schedule) }, 'Global reading schedule created', :created)
      else
        render_error('Failed to create global reading schedule', schedule.errors.full_messages)
      end
    end
  end

  # GET /api/v1/admin/meters/:meter_id/schedule
  def show_meter
    schedule = ReadingSchedule.for_meter(params[:meter_id]).first
    if schedule
      render_success({ reading_schedule: schedule_json(schedule) }, 'Meter reading schedule retrieved')
    else
      # Return global default as fallback info
      global = ReadingSchedule.global_default.first
      render_success({
        reading_schedule: nil,
        using_global_default: global ? schedule_json(global) : nil
      }, 'No individual schedule — using global default')
    end
  end

  # PATCH /api/v1/admin/meters/:meter_id/schedule
  def update_meter
    meter    = Meter.find(params[:meter_id])
    schedule = ReadingSchedule.for_meter(meter.id).first

    if schedule
      if schedule.update(schedule_params)
        render_success({ reading_schedule: schedule_json(schedule) }, 'Meter reading schedule updated')
      else
        render_error('Failed to update meter reading schedule', schedule.errors.full_messages)
      end
    else
      schedule = ReadingSchedule.new(schedule_params.merge(meter_id: meter.id, created_by_id: current_user.id))
      if schedule.save
        render_success({ reading_schedule: schedule_json(schedule) }, 'Meter reading schedule created', :created)
      else
        render_error('Failed to create meter reading schedule', schedule.errors.full_messages)
      end
    end
  rescue ActiveRecord::RecordNotFound
    render_error('Meter not found', [], :not_found)
  end

  # DELETE /api/v1/admin/meters/:meter_id/schedule
  # Removes per-meter schedule — meter reverts to global default
  def destroy_meter
    schedule = ReadingSchedule.for_meter(params[:meter_id]).first
    if schedule
      schedule.update!(active: false)
      render_success({}, 'Meter reading schedule removed — meter will use global default')
    else
      render_error('No individual reading schedule found for this meter', [], :not_found)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def schedule_params
    params.require(:reading_schedule).permit(:schedule_type, :interval_value, :daily_time, :active)
  end

  def schedule_json(s)
    {
      id:             s.id,
      meter_id:       s.meter_id,
      meter_serial:   s.meter ? s.meter.meter_serial : nil,
      schedule_type:  s.schedule_type,
      interval_value: s.interval_value,
      daily_time:     s.daily_time,
      description:    s.description,
      active:         s.active,
      global:         s.global?,
      created_at:     s.created_at,
      updated_at:     s.updated_at
    }
  end
end
