# One fake provider per app process. Replacing a dispatcher preserves its ledger.
class PaymentRuntime
  class << self
    attr_reader :provider, :dispatcher

    def reset!(provider: FakeProvider.new)
      @provider = provider
      @dispatcher = PayoutDispatcher.new(provider: provider)
    end
  end
  reset!
end
