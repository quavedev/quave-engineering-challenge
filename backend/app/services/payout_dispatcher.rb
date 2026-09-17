class PayoutDispatcher
  def initialize(provider:)
    @provider = provider
  end

  def dispatch(merchant_id:, payout_id:, delivery_id:)
    payout = Payout.find_by!(merchant_id: merchant_id, payout_id: payout_id)
    transfer = @provider.create_transfer(
      payout.provider_payload,
      idempotency_key: [merchant_id, payout_id].to_json
    )
    payout.update!(status: "paid", transfer_id: transfer.fetch(:transfer_id))
    payout
  end
end
