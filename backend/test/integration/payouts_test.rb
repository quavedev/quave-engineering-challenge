require "test_helper"

class PayoutsTest < ActionDispatch::IntegrationTest
  test "lists a merchant payout in integer cents" do
    create_payout
    get "/api/merchants/cedar/payouts"
    assert_response :success
    assert_equal [{ "merchantId" => "cedar", "payoutId" => "17", "amountCents" => 18750,
                    "currency" => "USD", "status" => "pending", "transferId" => nil }], response.parsed_body
  end

  test "filters payouts by status" do
    create_payout
    create_payout(id: "18", status: "paid")
    get "/api/merchants/cedar/payouts", params: { status: "pending" }
    assert_equal ["17"], response.parsed_body.map { |row| row["payoutId"] }
  end

  test "dispatches and safely redelivers a payout" do
    create_payout
    2.times do |attempt|
      post "/api/merchants/cedar/payouts/17/dispatch", params: { delivery_id: "job-#{attempt}" }, as: :json
      assert_response :success
      assert_equal "paid", response.parsed_body["status"]
    end
    assert_equal 1, PaymentRuntime.provider.ledger.size
  end
end
