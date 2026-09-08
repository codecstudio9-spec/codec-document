// Supabase Edge Function — lets a company owner/admin provision a brand
// new teammate account directly with an email + password THEY choose,
// as an alternative to inviting someone who already has a Codec Document
// account (addCompanyMember / add_company_member_by_email).
//
// Why this has to be an Edge Function and not a plain RPC: creating an
// auth.users row with a password requires the Supabase Admin Auth API
// (auth.admin.createUser), which only works with the service-role key —
// never exposable to the browser. This function is the only place that
// key is used for this purpose.
//
// Deploy:
//   supabase functions deploy admin-create-company-user
// Secrets: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const VALID_ROLES = new Set(['owner', 'admin', 'manager', 'user']);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface RequestBody {
  email?: string;
  password?: string;
  role?: string;
  fullName?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500, headers: corsHeaders(origin),
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: callerData } = await admin.auth.getUser(jwt);
    const callerId = callerData?.user?.id ?? null;
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    const body = (await req.json()) as RequestBody;
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    const role = body.role ?? 'user';
    const fullName = (body.fullName ?? '').trim();

    if (!/.+@.+\..+/.test(email)) {
      return new Response(JSON.stringify({ error: 'Enter a valid email address' }), {
        status: 400, headers: corsHeaders(origin),
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400, headers: corsHeaders(origin),
      });
    }
    if (!VALID_ROLES.has(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400, headers: corsHeaders(origin),
      });
    }

    // Only an owner/admin of a real company can provision teammates — same
    // authorization rule as add_company_member_by_email.
    const { data: membership } = await admin
      .from('company_members')
      .select('company_id, role')
      .eq('user_id', callerId)
      .maybeSingle();
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Only a company owner or admin can create teammate accounts' }), {
        status: 403, headers: corsHeaders(origin),
      });
    }

    // Seat limit — see public.company_has_seat_available() in
    // 20260907120000_enterprise_seats_and_team_visibility.sql. NULL
    // plan_seats (the legacy flat plan) is unlimited, same as today.
    const { data: hasSeat } = await admin.rpc('company_has_seat_available', { p_company_id: membership.company_id });
    if (hasSeat === false) {
      return new Response(JSON.stringify({ error: 'Your Enterprise plan is out of seats — remove a member or add more seats first.' }), {
        status: 409, headers: corsHeaders(origin),
      });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });
    if (createErr || !created?.user) {
      const message = createErr?.message?.includes('already been registered')
        ? 'An account with that email already exists — use "Invite by email" instead.'
        : (createErr?.message || 'Could not create the account');
      return new Response(JSON.stringify({ error: message }), {
        status: 409, headers: corsHeaders(origin),
      });
    }

    const { error: memberErr } = await admin
      .from('company_members')
      .insert({ company_id: membership.company_id, user_id: created.user.id, role });
    if (memberErr) {
      // Roll back the just-created auth user so a failed membership insert
      // doesn't leave an orphaned account nobody can see or manage.
      await admin.auth.admin.deleteUser(created.user.id);
      return new Response(JSON.stringify({ error: `Could not add the new account to your company: ${memberErr.message}` }), {
        status: 500, headers: corsHeaders(origin),
      });
    }

    return new Response(
      JSON.stringify({ verified: true, userId: created.user.id, email }),
      { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('admin-create-company-user error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500, headers: corsHeaders(origin),
    });
  }
});
