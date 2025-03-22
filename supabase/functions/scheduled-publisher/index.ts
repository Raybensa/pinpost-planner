
// This edge function will be responsible for publishing scheduled posts
// Follow this URL format: https://zoliumvlprgssryecypq.supabase.co/functions/v1/scheduled-publisher
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the admin key
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// This function does the actual work of finding and publishing posts
async function publishScheduledPosts() {
  console.log('Running scheduled publisher...')
  
  // Get all scheduled posts that are due to be published
  const now = new Date()
  const { data: postsToPublish, error } = await supabase
    .from('pin_posts')
    .select('*')
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
      // In a real implementation, this is where you would call the Pinterest API
      // For now, we'll just update the status to 'published'
      
      const { data, error: updateError } = await supabase
        .from('pin_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          // Simulate a successful Pinterest API response
          pinterest_post_id: `pin_${Math.random().toString(36).substring(2, 15)}`
        })
        .eq('id', post.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      results.push({
        id: post.id,
        status: 'success',
        message: 'Post published successfully'
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
