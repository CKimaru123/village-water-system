class CreatePollOptions < ActiveRecord::Migration[8.1]
  def change
    create_table :poll_options do |t|
      t.integer :poll_id
      t.string :option_text
      t.integer :votes_count

      t.timestamps
    end
  end
end
