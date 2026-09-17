class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Payout not found" }, status: :not_found
  end
  rescue_from ProviderError do |error|
    render json: { error: error.message }, status: :bad_gateway
  end
end
