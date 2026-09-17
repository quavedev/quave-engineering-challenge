module Api
  class PayoutsController < ApplicationController
    def index
      payouts = Payout.where(merchant_id: params[:merchant_id])
      payouts = payouts.where(status: params[:status]) if params[:status].present?
      fresh_when(etag: payouts, last_modified: payouts.maximum(:updated_at), public: false)
      return if performed?
      render json: payouts.order(:payout_id).map(&:api_payload)
    end

    def create_transfer
      payout = PaymentRuntime.dispatcher.dispatch(
        merchant_id: params[:merchant_id], payout_id: params[:payout_id],
        delivery_id: params.require(:delivery_id)
      )
      render json: payout.api_payload
    end
  end
end
