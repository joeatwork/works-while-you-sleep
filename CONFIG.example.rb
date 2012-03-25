
# QUICK AND CHEEZY DEPLOY CONFIGURATION.
# Change the example strings below to actual deploy info for your server.
# (Or don't, it's cool...)
module CONFIG
  class << self
    def remote_hostname
      "myhost.mydomain.example"
    end
    
    def remote_user 
      "username"
    end
    
    def remote_password
      "super_secret_password"
    end
    
    def remote_root
      "/home/USERNAME/APPDIR"
    end
  end # singleton
end # module
