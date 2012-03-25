require 'net/scp'

require "./CONFIG.rb" # LOCAL- you'll need to provide this. See CONFIG.example.rb

desc "Push the site to the appropriate spot on the server."
task :deploy do
  Net::SCP.start(CONFIG.remote_hostname, CONFIG.remote_user, :password => CONFIG.remote_password) do |scp|

    # HEY THIS IS PROBABLY WRONG. Needs a chmod -R
    # AND you need a release/symlink or you'll continue to deploy over JUNK.
    # Anyhow, maybe rethink capistrano or what-have-you.

    scp.upload!("site/fonts", CONFIG.remote_root, :recursive => true)
    scp.upload!("site/images", CONFIG.remote_root, :recursive => true)
    scp.upload!("site/levels", CONFIG.remote_root, :recursive => true)    
    scp.upload!("site/index.html", CONFIG.remote_root)

  end # SCP.start
end
