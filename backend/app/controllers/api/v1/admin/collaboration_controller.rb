class Api::V1::Admin::CollaborationController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin
  before_action :set_task, only: [
    :show_task, :update_task, :delete_task,
    :add_member, :remove_member,
    :create_subtask, :update_subtask, :delete_subtask,
    :task_comments, :add_comment
  ]

  # ── Tasks ──────────────────────────────────────────────────────────────────

  # GET /api/v1/admin/collaboration/tasks
  def tasks
    scope = CollaborationTask.includes(:assigned_to, :created_by, :task_members, :task_subtasks, :task_comments)
    # Super admins see all; regular admins see tasks they created or are members of
    unless current_user.super_admin?
      scope = scope.where(
        'created_by_id = :uid OR assigned_to_id = :uid OR id IN (SELECT collaboration_task_id FROM task_members WHERE user_id = :uid)',
        uid: current_user.id
      )
    end
    scope = scope.where(status: params[:status]) if params[:status].present?
    render_success({ tasks: scope.recent.map { |t| task_json(t) } }, 'Tasks retrieved')
  end

  # GET /api/v1/admin/collaboration/tasks/:id
  def show_task
    render_success({ task: task_json(@task, detailed: true) }, 'Task retrieved')
  end

  # POST /api/v1/admin/collaboration/tasks
  def create_task
    task = CollaborationTask.new(task_params)
    task.created_by = current_user
    if task.save
      # Auto-add creator as member
      task.task_members.create(user: current_user, role: 'lead')
      render_success({ task: task_json(task, detailed: true) }, 'Task created', :created)
    else
      render_error('Failed to create task', task.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/collaboration/tasks/:id
  def update_task
    if @task.update(task_params)
      render_success({ task: task_json(@task, detailed: true) }, 'Task updated')
    else
      render_error('Failed to update task', @task.errors.full_messages)
    end
  end

  # DELETE /api/v1/admin/collaboration/tasks/:id
  def delete_task
    @task.destroy!
    render_success({}, 'Task deleted')
  end

  # ── Members ────────────────────────────────────────────────────────────────

  # POST /api/v1/admin/collaboration/tasks/:id/members
  def add_member
    member = @task.task_members.find_or_initialize_by(user_id: params[:user_id])
    member.role = params[:role]
    if member.save
      render_success({ member: member_json(member) }, 'Member added')
    else
      render_error('Failed to add member', member.errors.full_messages)
    end
  end

  # DELETE /api/v1/admin/collaboration/tasks/:id/members/:user_id
  def remove_member
    member = @task.task_members.find_by(user_id: params[:user_id])
    return render_error('Member not found', [], :not_found) unless member
    member.destroy!
    render_success({}, 'Member removed')
  end

  # ── Sub-tasks ──────────────────────────────────────────────────────────────

  # POST /api/v1/admin/collaboration/tasks/:id/subtasks
  def create_subtask
    subtask = @task.task_subtasks.new(subtask_params)
    subtask.created_by = current_user
    if subtask.save
      render_success({ subtask: subtask_json(subtask) }, 'Sub-task created', :created)
    else
      render_error('Failed to create sub-task', subtask.errors.full_messages)
    end
  end

  # PATCH /api/v1/admin/collaboration/tasks/:id/subtasks/:subtask_id
  def update_subtask
    subtask = @task.task_subtasks.find(params[:subtask_id])
    if subtask.update(subtask_params)
      render_success({ subtask: subtask_json(subtask) }, 'Sub-task updated')
    else
      render_error('Failed to update sub-task', subtask.errors.full_messages)
    end
  end

  # DELETE /api/v1/admin/collaboration/tasks/:id/subtasks/:subtask_id
  def delete_subtask
    subtask = @task.task_subtasks.find(params[:subtask_id])
    subtask.destroy!
    render_success({}, 'Sub-task deleted')
  end

  # ── Comments ───────────────────────────────────────────────────────────────

  # GET /api/v1/admin/collaboration/tasks/:id/comments
  def task_comments
    comments = @task.task_comments.includes(:user).recent
    comments = comments.where(task_subtask_id: params[:subtask_id]) if params[:subtask_id].present?
    render_success({ comments: comments.map { |c| comment_json(c) } }, 'Comments retrieved')
  end

  # POST /api/v1/admin/collaboration/tasks/:id/comments
  def add_comment
    comment = @task.task_comments.new(
      user:           current_user,
      body:           params[:body],
      task_subtask_id: params[:subtask_id]
    )
    if comment.save
      # Notify all task members
      notify_task_members(@task, current_user, comment)
      render_success({ comment: comment_json(comment) }, 'Comment added', :created)
    else
      render_error('Failed to add comment', comment.errors.full_messages)
    end
  end

  # GET /api/v1/admin/collaboration/admins — list all admin users for member picker
  def admins
    users = User.where(role: %w[admin super_admin]).order(:first_name)
    render_success({ admins: users.map { |u| { id: u.id, name: u.display_name, role: u.role, email: u.email } } }, 'Admins retrieved')
  end

  private

  def set_task
    @task = CollaborationTask.includes(
      :assigned_to, :created_by,
      task_members: :user,
      task_subtasks: [:created_by, :task_comments],
      task_comments: :user
    ).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Task not found', [], :not_found)
  end

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def task_params
    params.require(:task).permit(:title, :description, :status, :priority, :assigned_to_id, :due_date)
  end

  def subtask_params
    params.require(:subtask).permit(:title, :description, :status, :role_label)
  end

  def task_json(t, detailed: false)
    data = {
      id:          t.id,
      title:       t.title,
      description: t.description,
      status:      t.status,
      priority:    t.priority,
      assigned_to: t.assigned_to&.display_name,
      assigned_to_id: t.assigned_to_id,
      created_by:  t.created_by&.display_name,
      created_by_id: t.created_by_id,
      due_date:    t.due_date,
      created_at:  t.created_at,
      member_count:  t.task_members.size,
      subtask_count: t.task_subtasks.size,
      comment_count: t.task_comments.where(task_subtask_id: nil).size,
      members: t.task_members.map { |m| member_json(m) },
    }
    if detailed
      data[:subtasks] = t.task_subtasks.recent.map { |s| subtask_json(s, with_comments: true) }
      data[:comments] = t.task_comments.where(task_subtask_id: nil).recent.map { |c| comment_json(c) }
    end
    data
  end

  def member_json(m)
    { user_id: m.user_id, name: m.user&.display_name, role: m.role, email: m.user&.email }
  end

  def subtask_json(s, with_comments: false)
    data = {
      id:          s.id,
      title:       s.title,
      description: s.description,
      status:      s.status,
      role_label:  s.role_label,
      created_by:  s.created_by&.display_name,
      created_by_id: s.created_by_id,
      created_at:  s.created_at,
      comment_count: s.task_comments.size,
    }
    data[:comments] = s.task_comments.recent.map { |c| comment_json(c) } if with_comments
    data
  end

  def comment_json(c)
    {
      id:            c.id,
      body:          c.body,
      user_id:       c.user_id,
      author:        c.user&.display_name,
      subtask_id:    c.task_subtask_id,
      created_at:    c.created_at,
    }
  end

  def notify_task_members(task, sender, comment)
    task.task_members.where.not(user_id: sender.id).each do |tm|
      Notification.create!(
        user_id:  tm.user_id,
        title:    "New comment on: #{task.title}",
        message:  "#{sender.display_name}: #{comment.body.truncate(80)}",
        category: 'collaboration',
        read:     false
      ) rescue nil
    end
  end
end
