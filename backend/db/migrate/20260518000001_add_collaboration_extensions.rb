class AddCollaborationExtensions < ActiveRecord::Migration[8.1]
  def change
    # Task members — many admins can be part of one task
    create_table :task_members do |t|
      t.integer :collaboration_task_id, null: false
      t.integer :user_id, null: false
      t.string  :role          # e.g. "finance", "project_manager", "secretary"
      t.timestamps
    end
    add_index :task_members, [:collaboration_task_id, :user_id], unique: true

    # Sub-tasks — a member's specific contribution/role within a task
    create_table :task_subtasks do |t|
      t.integer :collaboration_task_id, null: false
      t.integer :created_by_id, null: false
      t.string  :title, null: false
      t.text    :description
      t.string  :status, default: 'pending'   # pending, in_progress, completed
      t.string  :role_label                   # e.g. "Finance Report", "Project Update"
      t.timestamps
    end
    add_index :task_subtasks, :collaboration_task_id

    # Task comments — discussion thread on main task or sub-task
    create_table :task_comments do |t|
      t.integer :collaboration_task_id, null: false
      t.integer :task_subtask_id        # nil = comment on main task
      t.integer :user_id, null: false
      t.text    :body, null: false
      t.timestamps
    end
    add_index :task_comments, :collaboration_task_id
    add_index :task_comments, :task_subtask_id
  end
end
