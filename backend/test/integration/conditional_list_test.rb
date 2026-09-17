require "test_helper"

class ConditionalListTest < ActionDispatch::IntegrationTest
  test "unchanged merchant list can be revalidated" do
    create_payout
    get "/api/merchants/cedar/payouts"
    assert_response :success
    tag = response.headers.fetch("ETag")
    get "/api/merchants/cedar/payouts", headers: { "If-None-Match" => tag }
    assert_response :not_modified
  end

  test "validator belongs to the selected merchant" do
    create_payout
    create_payout(merchant: "maple", amount: 7001)
    get "/api/merchants/cedar/payouts"
    tag = response.headers.fetch("ETag")
    get "/api/merchants/maple/payouts", headers: { "If-None-Match" => tag }
    assert_response :success
    assert_equal ["maple"], response.parsed_body.map { |row| row["merchantId"] }
  end
end
