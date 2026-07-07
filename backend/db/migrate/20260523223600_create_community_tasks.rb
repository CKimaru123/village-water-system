class CreateCommunityTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :community_tasks do |t|
      t.string  :title,       null: false
      t.text    :description
      t.string  :zone
      t.date    :due_date
      t.string  :priority,    default: "normal"
      t.string  :status,      default: "open"
      t.integer :created_by_id
      t.timestamps
    end

    create_table :task_volunteers do |t|
      t.integer :community_task_id, null: false
      t.integer :user_id,           null: false
      t.string  :role,              default: "General Helper"
      t.string  :status,            default: "active"
      t.timestamps
    end

    add_index :community_tasks,  :status
    add_index :task_volunteers,  :community_task_id
    add_index :task_volunteers,  [:community_task_id, :user_id], unique: true
  end
end
