require "ipaddr"

Rails.application.configure do
  config.enable_reloading = true
  config.consider_all_requests_local = true
  config.hosts << IPAddr.new("0.0.0.0/0")
  config.hosts << IPAddr.new("::/0")
end
