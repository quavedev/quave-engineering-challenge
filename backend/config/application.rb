require_relative "boot"
require "rails"
require "active_record/railtie"
require "action_controller/railtie"
require "rails/test_unit/railtie"
Bundler.require(*Rails.groups)

module PayoutReview
  class Application < Rails::Application
    config.load_defaults 8.1
    config.api_only = true
    config.eager_load = false
    config.secret_key_base = "synthetic-local-challenge-not-a-production-secret-" * 3
    config.hosts = ["localhost", "127.0.0.1", "www.example.com"]
  end
end
