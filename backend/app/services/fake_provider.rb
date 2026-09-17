# Synthetic external provider. No network calls or real money.
class FakeProvider
  attr_accessor :before_request

  def initialize(outcomes: [])
    @accepted = {}
    @requests = []
    @outcomes = outcomes.dup
    @mutex = Mutex.new
  end

  def create_transfer(payload, idempotency_key:)
    request = { payload: payload.deep_dup, key: idempotency_key }
    outcome = @mutex.synchronize do
      @requests << request.deep_dup
      @outcomes.shift || :ok
    end
    before_request&.call(request.deep_dup)
    raise ProviderError, "PROVIDER_UNAVAILABLE" if outcome == :reject_before_acceptance

    transfer = @mutex.synchronize do
      existing = @accepted[idempotency_key]
      if existing && existing[:payload] != payload
        raise ProviderError, "IDEMPOTENCY_CONFLICT"
      end
      @accepted[idempotency_key] ||= {
        transfer_id: "transfer-#{@accepted.size + 1}", payload: payload.deep_dup
      }
      @accepted[idempotency_key].deep_dup
    end
    raise ProviderError, "PROVIDER_TIMEOUT" if outcome == :timeout_after_acceptance
    transfer
  end

  def requests
    @mutex.synchronize { @requests.deep_dup }
  end

  def ledger
    @mutex.synchronize { @accepted.values.deep_dup }
  end
end
