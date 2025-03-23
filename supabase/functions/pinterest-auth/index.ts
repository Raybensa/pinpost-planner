
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the admin key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pinterest OAuth configuration
const PINTEREST_CLIENT_ID = Deno.env.get('PINTEREST_CLIENT_ID') || ''
const PINTEREST_CLIENT_SECRET = Deno.env.get('PINTEREST_CLIENT_SECRET') || ''
const REDIRECT_URI = Deno.env.get('PINTEREST_REDIRECT_URI') || ''

// Helper to log API interactions
async function logPinterestApiCall(userId: string, endpoint: string, statusCode?: number, responseBody?: string, errorMessage?: string, postId?: string) {
  await supabase.from('pinterest_api_logs').insert({
    user_id: userId,
    post_id: postId || null,
    endpoint,
    status_code: statusCode || null,
    response_body: responseBody || null,
    error_message: errorMessage || null,
  })
}

async function handleGetAuthUrl(req: Request) {
  try {
    // For simplicity, we'll use the auth header to get the user ID
    const authHeader = req.headers.get('Authorization')?.split(' ')[1]
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the token and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate Pinterest OAuth URL
    // Pinterest requires these scopes for creating pins
    const scopes = ['boards:read', 'pins:read', 'pins:write']
    const state = user.id // We'll use the user ID as the state parameter for verification
    
    const authUrl = `https://www.pinterest.com/oauth/?client_id=${PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes.join(','))}&state=${state}`
    
    return new Response(
      JSON.stringify({ url: authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCallback(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  
  if (!code) {
    return new Response(
      JSON.stringify({ error: 'No authorization code provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PINTEREST_CLIENT_ID}:${PINTEREST_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      await logPinterestApiCall(
        state as string,
        '/v5/oauth/token',
        tokenResponse.status,
        JSON.stringify(tokenData),
        'Failed to exchange code for token'
      )
      
      throw new Error(`Failed to exchange code: ${JSON.stringify(tokenData)}`)
    }
    
    const { access_token, refresh_token, expires_in } = tokenData
    
    // Get user's Pinterest information
    const userResponse = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })
    
    const userData = await userResponse.json()
    
    // Calculate token expiration date
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)
    
    // Store tokens in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        pinterest_access_token: access_token,
        pinterest_refresh_token: refresh_token,
        pinterest_token_expires_at: expiresAt.toISOString()
      })
      .eq('id', state)
    
    if (updateError) {
      throw new Error(`Error updating profile: ${updateError.message}`)
    }
    
    // Log successful authentication
    await logPinterestApiCall(
      state as string,
      '/v5/oauth/token',
      tokenResponse.status,
      'Authentication successful',
      null
    )
    
    // Redirect back to the application
    return new Response(
      null,
      {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${url.origin}/dashboard?pinterest_connected=true`
        }
      }
    )
  } catch (error) {
    console.error('Error in Pinterest OAuth callback:', error)
    
    // Redirect back with error
    return new Response(
      null,
      {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${url.origin}/dashboard?pinterest_error=${encodeURIComponent(error.message)}`
        }
      }
    )
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const url = new URL(req.url)
  
  // Route handling
  if (url.pathname.endsWith('/callback')) {
    return handleCallback(req)
  } else {
    return handleGetAuthUrl(req)
  }
})
