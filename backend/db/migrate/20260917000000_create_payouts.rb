class CreatePayouts < ActiveRecord::Migration[8.1]
  def change
    create_table :payouts do |t|
      t.string :merchant_id, null: false
      t.string :payout_id, null: false
      t.string :destination, null: false
      t.integer :amount_cents, null: false
      t.string :currency, null: false, default: "USD"
      t.string :status, null: false, default: "pending"
      t.string :transfer_id
      t.timestamps
    end
    add_index :payouts, [:merchant_id, :payout_id], unique: true
  end
end
