class Api::V1::CommunityTasksController < ApplicationController
  before_action :authenticate_request
  before_action :set_task, only: [:show, :update, :destroy, :volunteer, :leave]

  # GET /api/v1/community_tasks
  def index
    tasks = CommunityTask.includes(task_volunteers: :user).recent
    render_success({ tasks: tasks.map { |t| task_json(t) } }, "Tasks retrieved")
  end

  # GET /api/v1/community_tasks/:id
  def show
    render_success({ task: task_json(@task) }, "Task retrieved")
  end

  # POST /api/v1/community_tasks  (admin only)
  def create
    unless current_user.admin? || current_user.super_admin?
      return render_error("Admin only", [], :forbidden)
    end
    task = CommunityTask.new(task_params.merge(created_by: current_user))
    if task.save
      broadcast_task_update(task)
      render_success({ task: task_json(task) }, "Task created", :created)
    else
      render_error("Failed to create task", task.errors.full_messages)
    end
  end

  # PATCH /api/v1/community_tasks/:id  (admin only)
  def update
    unless current_user.admin? || current_user.super_admin?
      return render_error("Admin only", [], :forbidden)
    end
    if @task.update(task_params)
      broadcast_task_update(@task)
      render_success({ task: task_json(@task) }, "Task updated")
    else
      render_error("Failed to update task", @task.errors.full_messages)
    end
  end

  # DELETE /api/v1/community_tasks/:id  (admin only)
  def destroy
    unless current_user.admin? || current_user.super_admin?
      return render_error("Admin only", [], :forbidden)
    end
    @task.destroy!
    ActionCable.server.broadcast("community_tasks", { type: "task_deleted", task_id: @task.id })
    render_success({}, "Task deleted")
  end

  # POST /api/v1/community_tasks/:id/volunteer
  def volunteer
    role = params[:role] || "General Helper"
    tv = TaskVolunteer.find_or_initialize_by(community_task: @task, user: current_user)
    tv.role = role
    if tv.save
      broadcast_task_update(@task)
      # Notify admins via ActionCable
      ActionCable.server.broadcast("community_tasks", {
        type: "volunteer_joined",
        task_id: @task.id,
        volunteer: { id: current_user.id, name: current_user.display_name, role: role },
        task_title: @task.title
      })
      render_success({ task: task_json(@task) }, "Volunteered successfully")
    else
      render_error("Already volunteered or error", tv.errors.full_messages)
    end
  end

  # DELETE /api/v1/community_tasks/:id/leave
  def leave
    tv = TaskVolunteer.find_by(community_task: @task, user: current_user)
    if tv
      tv.destroy!
      broadcast_task_update(@task)
      render_success({}, "Left task")
    else
      render_error("Not volunteered for this task")
    end
  end

  private

  def set_task
    @task = CommunityTask.includes(task_volunteers: :user).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error("Task not found", [], :not_found)
  end

  def task_params
    params.require(:community_task).permit(:title, :description, :zone, :due_date, :priority, :status)
  end

  def task_json(t)
    {
      id:          t.id,
      title:       t.title,
      description: t.description,
      zone:        t.zone,
      due:         t.due_date&.to_s,
      priority:    t.priority,
      status:      t.status,
      open:        t.status == "open",
      created_by:  t.created_by&.display_name,
      volunteers:  t.volunteer_list,
      created_at:  t.created_at
    }
  end

  def broadcast_task_update(task)
    ActionCable.server.broadcast("community_tasks", {
      type: "task_updated",
      task: task_json(task)
    })
  end
end
