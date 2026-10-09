// Extends app.json (the static config lives there) with the Firebase file that
// Android needs for push notifications (FCM). google-services.json is not
// committed: on EAS Build it comes from the file-type environment variable
// GOOGLE_SERVICES_JSON; locally it is read from ./google-services.json.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
