class CreatePollVotes < ActiveRecord::Migration[8.1]
  def change
    create_table :poll_votes do |t|
      t.integer :poll_id
      t.integer :poll_option_id
      t.integer :user_id

      t.timestamps
    end
  end
end
