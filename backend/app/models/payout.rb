class Payout < ApplicationRecord
  validates :merchant_id, :payout_id, :destination, presence: true
  validates :payout_id, uniqueness: { scope: :merchant_id }
  validates :amount_cents, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: %w[pending paid] }
  validates :currency, inclusion: { in: ["USD"] }

  def provider_payload
    attributes.slice("merchant_id", "payout_id", "destination", "amount_cents", "currency")
  end

  def api_payload
    {
      merchantId: merchant_id, payoutId: payout_id, amountCents: amount_cents,
      currency: currency, status: status, transferId: transfer_id
    }
  end
end
