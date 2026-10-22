#!/usr/bin/env node

/**
 * Portfolio Sync Script
 * Parses README.md frontmatter and syncs entries to Supabase
 * 
 * Expected README.md format:
 * ---
 * projects:
 *   - id: "p-1"
 *     type: "system_ml"
 *     title: "Project Title"
 *     summary: "Project description..."
 *     tech_tags: ["Python", "TensorFlow"]
 *     live_url: "https://example.com"
 *     github_url: "https://github.com/user/repo"
 * ---
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Environment validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   Required: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parse YAML frontmatter from README.md
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    console.warn('⚠️  No frontmatter found in README.md');
    return null;
  }

  try {
    // Simple YAML-like parsing for our specific structure
    const yamlContent = match[1];
    const projects = [];
    
    // This is a simplified parser - in production, use a proper YAML library
    const projectBlocks = yamlContent.split(/\n\s*-\s*id:/);
    
    for (let i = 1; i < projectBlocks.length; i++) {
      const block = 'id:' + projectBlocks[i];
      const project = {};
      
      // Extract each field
      const idMatch = block.match(/id:\s*["'](.+?)["']/);
      const typeMatch = block.match(/type:\s*["'](.+?)["']/);
      const titleMatch = block.match(/title:\s*["'](.+?)["']/);
      const summaryMatch = block.match(/summary:\s*["'](.+?)["']/);
      const tagsMatch = block.match(/tech_tags:\s*\[(.*?)\]/);
      const liveUrlMatch = block.match(/live_url:\s*["'](.+?)["']/);
      const githubUrlMatch = block.match(/github_url:\s*["'](.+?)["']/);
      
      if (idMatch) project.id = idMatch[1];
      if (typeMatch) project.type = typeMatch[1];
      if (titleMatch) project.title = titleMatch[1];
      if (summaryMatch) project.summary = summaryMatch[1];
      if (tagsMatch) {
        project.tech_tags = tagsMatch[1]
          .split(',')
          .map(t => t.trim().replace(/["']/g, ''))
          .filter(t => t.length > 0);
      }
      if (liveUrlMatch) project.live_url = liveUrlMatch[1];
      if (githubUrlMatch) project.github_url = githubUrlMatch[1];
      
      if (project.id && project.title) {
        projects.push(project);
      }
    }
    
    return projects;
  } catch (error) {
    console.error('❌ Failed to parse frontmatter:', error.message);
    return null;
  }
}

/**
 * Upsert projects to Supabase
 */
async function syncToSupabase(projects) {
  console.log(`\n📊 Syncing ${projects.length} projects to Supabase...`);
  
  for (const project of projects) {
    try {
      const { error } = await supabase
        .from('portfolio_entries')
        .upsert({
          id: project.id,
          type: project.type || 'system_ml',
          title: project.title,
          summary: project.summary || '',
          tech_tags: project.tech_tags || [],
          live_url: project.live_url || null,
          github_url: project.github_url || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error(`❌ Failed to upsert ${project.id}:`, error.message);
      } else {
        console.log(`✅ Synced: ${project.id} - ${project.title}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${project.id}:`, error.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Portfolio Sync Script\n');
  
  // Read README.md
  const readmePath = path.join(process.cwd(), 'README.md');
  
  if (!fs.existsSync(readmePath)) {
    console.error('❌ README.md not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(readmePath, 'utf-8');
  console.log('✅ README.md loaded');
  
  // Parse frontmatter
  const projects = parseFrontmatter(content);
  
  if (!projects || projects.length === 0) {
    console.warn('⚠️  No projects found to sync');
    process.exit(0);
  }
  
  console.log(`✅ Parsed ${projects.length} projects from frontmatter`);
  
  // Sync to Supabase
  await syncToSupabase(projects);
  
  console.log('\n✅ Portfolio sync completed successfully');
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
