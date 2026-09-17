ENV["RAILS_ENV"] = "test"
require_relative "../config/environment"
require "rails/test_help"

class ActiveSupport::TestCase
  # Committed records are visible to separate service threads in concurrency tests.
  self.use_transactional_tests = false

  setup do
    Payout.delete_all
    PaymentRuntime.reset!
  end

  def create_payout(merchant: "cedar", id: "17", amount: 18750, status: "pending")
    Payout.create!(merchant_id: merchant, payout_id: id, amount_cents: amount,
                  destination: "bank-#{merchant}", currency: "USD", status: status)
  end
end
