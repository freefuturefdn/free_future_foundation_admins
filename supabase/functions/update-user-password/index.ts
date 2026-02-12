import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create a client with the caller's JWT to verify identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Check the caller has super_admin or admin role in account-types table
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerAccount } = await adminClient
      .from('account-types')
      .select('account_type')
      .eq('user_email', caller.email?.toLowerCase())
      .maybeSingle();

    if (!callerAccount || !['super_admin', 'admin'].includes(callerAccount.account_type)) {
      return new Response(JSON.stringify({ error: 'Forbidden: only super_admin and admin can update passwords' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Parse the request body
    const { user_email, new_password } = await req.json();

    if (!user_email || !new_password) {
      return new Response(JSON.stringify({ error: 'user_email and new_password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new_password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Find the target user by email using admin API
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) {
      return new Response(JSON.stringify({ error: 'Failed to list users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetUser = users.find(
      (u) => u.email?.toLowerCase() === user_email.toLowerCase()
    );

    if (!targetUser) {
      return new Response(JSON.stringify({ error: `No auth user found with email: ${user_email}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Admin can only update passwords for team_member and manager (not other admins/super_admins)
    if (callerAccount.account_type === 'admin') {
      const { data: targetAccount } = await adminClient
        .from('account-types')
        .select('account_type')
        .eq('user_email', user_email.toLowerCase())
        .maybeSingle();

      if (targetAccount && ['super_admin', 'admin'].includes(targetAccount.account_type)) {
        return new Response(JSON.stringify({ error: 'Admins cannot update passwords for other admins or super admins' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 7. Update the password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUser.id,
      { password: new_password }
    );

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: `Password updated successfully for ${user_email}` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
