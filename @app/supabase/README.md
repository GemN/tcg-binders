# Supabase

Local Supabase configuration, migrations, seed and migration helper.

## LINE Login

Add the following values to `@app/supabase/.env`:

```dotenv
SUPABASE_AUTH_CUSTOM_LINE_CLIENT_ID=your-line-channel-id
SUPABASE_AUTH_CUSTOM_LINE_CLIENT_SECRET=your-line-channel-secret
```

Register the callback printed by the configuration command in the LINE
Developers Console. With the default local ports, it is:

```text
http://127.0.0.1:55321/auth/v1/callback
```

`yarn db start` creates or updates the `custom:line` OAuth2 provider when both
values are present. If Supabase is already running, configure it directly:

```sh
yarn db auth:configure-line
```

The provider requests the `openid` and `profile` scopes. LINE web login signs ID
tokens with HS256, which is incompatible with LINE's OIDC discovery metadata, so
the local provider uses LINE's OAuth2 user-info endpoint instead. That endpoint
does not return email addresses, and LINE users are therefore created without a
Supabase email. Collect and verify an email after login if the application
requires one.
