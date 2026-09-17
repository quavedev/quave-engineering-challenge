[
  { merchant_id: "cedar", payout_id: "17", destination: "bank-cedar", amount_cents: 18750 },
  { merchant_id: "cedar", payout_id: "18", destination: "bank-cedar", amount_cents: 4200 },
  { merchant_id: "maple", payout_id: "17", destination: "bank-maple", amount_cents: 7001 }
].each do |attributes|
  Payout.find_or_create_by!(attributes.slice(:merchant_id, :payout_id)) do |payout|
    payout.assign_attributes(attributes)
  end
end
