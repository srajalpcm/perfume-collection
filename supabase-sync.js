/*
 * Legacy compatibility file.
 *
 * Cloud authentication, persistence, import syncing and the profile menu are
 * implemented directly in index.html. This file intentionally does nothing so
 * older deployments cannot load a second Supabase client or overwrite the
 * application's state.
 */
(function(){
  'use strict';
})();
