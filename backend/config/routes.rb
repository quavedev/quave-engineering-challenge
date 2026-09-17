Rails.application.routes.draw do
  namespace :api do
    get "merchants/:merchant_id/payouts", to: "payouts#index"
    post "merchants/:merchant_id/payouts/:payout_id/dispatch", to: "payouts#create_transfer"
  end
end
