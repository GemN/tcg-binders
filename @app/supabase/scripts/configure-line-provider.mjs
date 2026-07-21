#!/usr/bin/env node

import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

const LINE_PROVIDER_IDENTIFIER = "custom:line";
const LINE_AUTHORIZATION_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_USERINFO_URL = "https://api.line.me/oauth2/v2.1/userinfo";

const clientId = process.env.SUPABASE_AUTH_CUSTOM_LINE_CLIENT_ID;
const clientSecret = process.env.SUPABASE_AUTH_CUSTOM_LINE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.log(
    "Skipping local LINE provider: set SUPABASE_AUTH_CUSTOM_LINE_CLIENT_ID and SUPABASE_AUTH_CUSTOM_LINE_CLIENT_SECRET in @app/supabase/.env."
  );
  process.exit(0);
}

const getSupabaseStatus = () => {
  try {
    const output = execFileSync("supabase", ["status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return Object.fromEntries(
      output
        .split("\n")
        .map((line) => line.match(/^([A-Z_]+)="(.*)"$/))
        .filter(Boolean)
        .map((match) => [match[1], match[2]])
    );
  } catch {
    throw new Error(
      "Local Supabase is not running. Start it before configuring LINE."
    );
  }
};

const supabaseStatus = getSupabaseStatus();
const apiUrl = supabaseStatus.API_URL;
const serviceRoleKey = supabaseStatus.SERVICE_ROLE_KEY;

if (!apiUrl || !serviceRoleKey) {
  throw new Error(
    "Supabase status did not return API_URL and SERVICE_ROLE_KEY."
  );
}

const supabaseAdmin = createClient(apiUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

const providerConfiguration = {
  name: "LINE",
  client_id: clientId,
  client_secret: clientSecret,
  scopes: ["openid", "profile"],
  pkce_enabled: true,
  enabled: true,
  email_optional: true,
  authorization_url: LINE_AUTHORIZATION_URL,
  token_url: LINE_TOKEN_URL,
  userinfo_url: LINE_USERINFO_URL,
};

const { data: providersData, error: providersError } =
  await supabaseAdmin.auth.admin.customProviders.listProviders();

if (providersError) {
  throw providersError;
}

const existingProvider = providersData.providers.find(
  (provider) => provider.identifier === LINE_PROVIDER_IDENTIFIER
);

let action;

if (!existingProvider) {
  const { error } =
    await supabaseAdmin.auth.admin.customProviders.createProvider({
      provider_type: "oauth2",
      identifier: LINE_PROVIDER_IDENTIFIER,
      ...providerConfiguration,
    });

  if (error) {
    throw error;
  }
  action = "Created";
} else if (existingProvider.provider_type !== "oauth2") {
  const { error: deleteError } =
    await supabaseAdmin.auth.admin.customProviders.deleteProvider(
      LINE_PROVIDER_IDENTIFIER
    );

  if (deleteError) {
    throw deleteError;
  }

  const { error: createError } =
    await supabaseAdmin.auth.admin.customProviders.createProvider({
      provider_type: "oauth2",
      identifier: LINE_PROVIDER_IDENTIFIER,
      ...providerConfiguration,
    });

  if (createError) {
    throw createError;
  }
  action = "Recreated";
} else {
  const { error } =
    await supabaseAdmin.auth.admin.customProviders.updateProvider(
      LINE_PROVIDER_IDENTIFIER,
      providerConfiguration
    );

  if (error) {
    throw error;
  }
  action = "Updated";
}

console.log(
  `${action} local LINE OAuth2 provider (${LINE_PROVIDER_IDENTIFIER}).`
);
console.log(`Register this LINE callback URL: ${apiUrl}/auth/v1/callback`);
