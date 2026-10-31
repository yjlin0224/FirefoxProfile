// Firefox's autoconfig: makes Firefox run firefox.cfg (next to firefox.exe) at every
// startup. From this repo's install/; `task autoconfig:install` copies it to the install
// folder's defaults/pref/.
pref("general.config.filename", "firefox.cfg");
// The .cfg is plain text (by default Firefox expects its bytes shifted by 13)
pref("general.config.obscure_value", 0);
// With chrome privileges: it needs Services and the windows. Developer Edition (the aurora
// update channel) runs it so by default (checked in 159 without this line); release and beta
// builds sandbox it unless this is false. Only read from the default branch, so it has to be
// here, not in the .cfg or user.js.
// Firefox: nsReadConfig.cpp (sandboxEnabled from MOZ_UPDATE_CHANNEL, then this pref)
pref("general.config.sandbox_enabled", false);
