// Firefox's autoconfig: makes Firefox run firefoxprofile.cfg (next to firefox.exe) at every
// startup. From this repo's install/; `task autoconfig:install` copies it to the install
// folder's defaults/pref/.
pref("general.config.filename", "firefoxprofile.cfg");
// The .cfg is plain text (by default Firefox expects its bytes shifted by 13)
pref("general.config.obscure_value", 0);
// With chrome privileges, as by default (stated so a change shows): it needs Services and the
// windows
pref("general.config.sandbox_enabled", false);
