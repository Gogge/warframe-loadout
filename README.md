# Warframe Loadout

Weapon/Mod/Enemy formulas/stats in js/loadout.
Interface stuff in js/loadout/views/.

For development js/libs needs:

backbone.js - Backbone, [AMD compatible by James Burke](https://github.com/amdjs/backbone).
underscore.js - Underscore, [AMD compatible](https://github.com/amdjs/underscore).
jquery-cookie.js - [jquery-cookie](https://github.com/carhartl/jquery-cookie) by Klaus Hartl.
require.js - [RequireJS](http://requirejs.org/)

jQuery is loaded from a CDN without defining a protocol (not setting http/https), so using non-server (eg. file://) will probably not work that great.
