
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // This function would ideally be triggered by a cron job
  // For now it can be manually triggered
  try {
    console.log('Running scheduled publisher...')
    
    // Get all scheduled posts that are due to be published
    const now = new Date()
    const { data: postsToPublish, error } = await supabase
      .from('pin_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_date', now.toISOString())
    
    if (error) throw error
    
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
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Published ${results.filter(r => r.status === 'success').length} of ${results.length} posts`,
        results
      }),
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
