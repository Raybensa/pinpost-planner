
// This edge function will be responsible for publishing scheduled posts to Pinterest
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the admin key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

// Helper function to refresh a Pinterest token if it's expired
async function refreshPinterestToken(userId: string, refreshToken: string) {
  try {
    const PINTEREST_CLIENT_ID = Deno.env.get('PINTEREST_CLIENT_ID') || ''
    const PINTEREST_CLIENT_SECRET = Deno.env.get('PINTEREST_CLIENT_SECRET') || ''
    
    const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${PINTEREST_CLIENT_ID}:${PINTEREST_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      await logPinterestApiCall(
        userId,
        '/v5/oauth/token (refresh)',
        tokenResponse.status,
        JSON.stringify(tokenData),
        'Failed to refresh token'
      )
      
      throw new Error(`Failed to refresh token: ${JSON.stringify(tokenData)}`)
    }
    
    const { access_token, refresh_token, expires_in } = tokenData
    
    // Calculate token expiration date
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in)
    
    // Update tokens in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        pinterest_access_token: access_token,
        pinterest_refresh_token: refresh_token,
        pinterest_token_expires_at: expiresAt.toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      throw new Error(`Error updating tokens: ${updateError.message}`)
    }
    
    return access_token
  } catch (error) {
    console.error('Error refreshing Pinterest token:', error)
    throw error
  }
}

// This function posts a pin to Pinterest
async function createPinterestPin(post, userId, accessToken, boardId) {
  try {
    // Check if approaching rate limit
    const { data: rateLimitCheck } = await supabase.rpc('check_pinterest_rate_limit', { user_id: userId })
    
    if (!rateLimitCheck) {
      throw new Error('Pinterest API rate limit approaching, skipping this post')
    }
    
    // Create the Pinterest pin
    const pinData = {
      title: post.title,
      description: post.description || '',
      link: post.link || '',
      board_id: boardId,
      media_source: {
        source_type: "image_base64", 
        content_type: "image/jpeg",
        data: post.image.replace(/^data:image\/[a-z]+;base64,/, '')
      }
    }
    
    const pinResponse = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(pinData)
    })
    
    const pinResult = await pinResponse.json()
    
    // Log the API call
    await logPinterestApiCall(
      userId,
      '/v5/pins',
      pinResponse.status,
      JSON.stringify(pinResult),
      pinResponse.ok ? null : 'Failed to create pin',
      post.id
    )
    
    if (!pinResponse.ok) {
      throw new Error(`Pinterest API error: ${JSON.stringify(pinResult)}`)
    }
    
    return pinResult.id
  } catch (error) {
    console.error(`Error creating Pinterest pin for post ${post.id}:`, error)
    throw error
  }
}

// Get the user's first board or create a default one if none exists
async function getOrCreatePinterestBoard(userId, accessToken) {
  try {
    // First check if we already have a board ID stored
    const { data: profile } = await supabase
      .from('profiles')
      .select('pinterest_board_id')
      .eq('id', userId)
      .single()
    
    if (profile?.pinterest_board_id) {
      return profile.pinterest_board_id
    }
    
    // Get user's boards
    const boardsResponse = await fetch('https://api.pinterest.com/v5/boards?page_size=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    const boardsData = await boardsResponse.json()
    
    // Log the API call
    await logPinterestApiCall(
      userId,
      '/v5/boards',
      boardsResponse.status,
      JSON.stringify(boardsData),
      boardsResponse.ok ? null : 'Failed to fetch boards'
    )
    
    if (!boardsResponse.ok) {
      throw new Error(`Pinterest API error: ${JSON.stringify(boardsData)}`)
    }
    
    let boardId
    
    // Use the first board if it exists
    if (boardsData.items && boardsData.items.length > 0) {
      boardId = boardsData.items[0].id
    } else {
      // Create a default board
      const createBoardResponse = await fetch('https://api.pinterest.com/v5/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: 'PinPost Scheduled Content',
          description: 'Automatically scheduled posts from PinPost app'
        })
      })
      
      const createBoardData = await createBoardResponse.json()
      
      // Log the API call
      await logPinterestApiCall(
        userId,
        '/v5/boards (create)',
        createBoardResponse.status,
        JSON.stringify(createBoardData),
        createBoardResponse.ok ? null : 'Failed to create board'
      )
      
      if (!createBoardResponse.ok) {
        throw new Error(`Pinterest API error: ${JSON.stringify(createBoardData)}`)
      }
      
      boardId = createBoardData.id
    }
    
    // Store the board ID for future use
    await supabase
      .from('profiles')
      .update({ pinterest_board_id: boardId })
      .eq('id', userId)
    
    return boardId
  } catch (error) {
    console.error('Error getting or creating Pinterest board:', error)
    throw error
  }
}

// This function does the actual work of finding and publishing posts
async function publishScheduledPosts() {
  console.log('Running scheduled publisher...')
  
  // Get all scheduled posts that are due to be published
  const now = new Date()
  const { data: postsToPublish, error } = await supabase
    .from('pin_posts')
    .select('*, profiles:user_id(pinterest_access_token, pinterest_refresh_token, pinterest_token_expires_at)')
    .eq('status', 'scheduled')
    .lte('scheduled_date', now.toISOString())
  
  if (error) {
    console.error('Error fetching scheduled posts:', error)
    return { success: false, error: error.message }
  }
  
  console.log(`Found ${postsToPublish?.length || 0} posts to publish`)
  
  // Process each post
  const results = []
  
  for (const post of postsToPublish || []) {
    try {
      // Skip posts where the user doesn't have Pinterest tokens
      if (!post.profiles?.pinterest_access_token) {
        await supabase
          .from('pin_posts')
          .update({
            publish_error: 'Pinterest account not connected'
          })
          .eq('id', post.id)
        
        results.push({
          id: post.id,
          status: 'error',
          message: 'Pinterest account not connected'
        })
        
        continue
      }
      
      const userId = post.user_id
      let accessToken = post.profiles.pinterest_access_token
      
      // Check if token is expired and refresh if needed
      const tokenExpiresAt = new Date(post.profiles.pinterest_token_expires_at)
      if (tokenExpiresAt <= new Date()) {
        console.log(`Token expired for user ${userId}, refreshing...`)
        accessToken = await refreshPinterestToken(
          userId,
          post.profiles.pinterest_refresh_token
        )
      }
      
      // Get or create a Pinterest board
      const boardId = await getOrCreatePinterestBoard(userId, accessToken)
      
      // Create the pin on Pinterest
      const pinId = await createPinterestPin(post, userId, accessToken, boardId)
      
      // Update the post in the database
      const { data, error: updateError } = await supabase
        .from('pin_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          pinterest_post_id: pinId
        })
        .eq('id', post.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      results.push({
        id: post.id,
        status: 'success',
        message: 'Post published successfully to Pinterest',
        pinterest_id: pinId
      })
    } catch (postError) {
      console.error(`Error publishing post ${post.id}:`, postError)
      
      // Update the post with the error
      await supabase
        .from('pin_posts')
        .update({
          publish_error: postError.message || 'Unknown error occurred'
        })
        .eq('id', post.id)
      
      results.push({
        id: post.id,
        status: 'error',
        message: postError.message || 'Unknown error occurred'
      })
    }
  }
  
  return {
    success: true,
    message: `Published ${results.filter(r => r.status === 'success').length} of ${results.length} posts`,
    results
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check if this is a cron job invocation (these usually come as POST with a particular signature)
    // or a manual trigger (which can be any method)
    const isCronInvocation = req.method === 'POST' && 
      (req.headers.get('user-agent')?.includes('supabase-postgres-cron') || 
       req.headers.get('user-agent')?.includes('Supabase'));
    
    if (isCronInvocation) {
      console.log('Invoked by Supabase cron job');
      // You can parse the body if needed
      const body = await req.json().catch(() => ({}));
      console.log('Cron job body:', body);
    } else {
      console.log('Manually triggered');
    }
    
    // Execute the actual publishing logic
    const result = await publishScheduledPosts();
    
    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (err) {
    console.error('Error in scheduled publisher:', err)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
