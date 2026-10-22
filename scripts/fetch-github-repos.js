#!/usr/bin/env node

/**
 * GitHub Repository Fetch Script (Local Only)
 * Fetches public repositories and saves to local JSON
 * No database required - perfect for getting started
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const GITHUB_USERNAME = 'anton-buen';

/**
 * Make HTTPS request to GitHub API
 */
function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Portfolio-Sync-Script',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    // Add GitHub token if available (increases rate limit)
    if (process.env.GITHUB_TOKEN) {
      options.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Fetch all public repositories for a user
 */
async function fetchUserRepos(username) {
  console.log(`📦 Fetching repositories for ${username}...`);
  
  try {
    const repos = await githubRequest(`/users/${username}/repos?per_page=100&sort=updated`);
    
    // Filter out forks and archived repos
    const activeRepos = repos.filter(repo => !repo.fork && !repo.archived);
    
    console.log(`✅ Found ${activeRepos.length} active repositories`);
    return activeRepos;
  } catch (error) {
    console.error('❌ Failed to fetch repositories:', error.message);
    return [];
  }
}

/**
 * Fetch README content for a repository
 */
async function fetchReadme(username, repoName) {
  try {
    const readme = await githubRequest(`/repos/${username}/${repoName}/readme`);
    
    if (readme.content) {
      // README content is base64 encoded
      const content = Buffer.from(readme.content, 'base64').toString('utf-8');
      return content;
    }
    
    return null;
  } catch (error) {
    // Many repos don't have READMEs
    return null;
  }
}

/**
 * Extract first meaningful paragraph from README
 */
function extractDescription(readmeContent) {
  if (!readmeContent) return null;

  // Remove HTML comments
  let content = readmeContent.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove frontmatter
  content = content.replace(/^---[\s\S]*?---\n/m, '');
  
  // Split into lines
  const lines = content.split('\n');
  
  // Find first substantial paragraph (not heading, not code block, not empty)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip headings, code blocks, horizontal rules, badges, empty lines
    if (
      line.length === 0 ||
      line.startsWith('#') ||
      line.startsWith('```') ||
      line.startsWith('---') ||
      line.startsWith('===') ||
      line.startsWith('![') ||
      line.startsWith('[![')
    ) {
      continue;
    }
    
    // Found a good description line
    if (line.length > 30) {
      // Clean markdown formatting
      return line
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/`/g, '')
        .trim();
    }
  }
  
  return null;
}

/**
 * Map GitHub language to tech tags
 */
function mapLanguagesToTags(languages) {
  const tagMap = {
    'JavaScript': 'JAVASCRIPT',
    'TypeScript': 'TYPESCRIPT',
    'Python': 'PYTHON',
    'Rust': 'RUST',
    'Go': 'GO',
    'Java': 'JAVA',
    'C++': 'C++',
    'C': 'C',
    'Ruby': 'RUBY',
    'PHP': 'PHP',
    'Swift': 'SWIFT',
    'Kotlin': 'KOTLIN',
    'HTML': 'HTML',
    'CSS': 'CSS',
    'SCSS': 'SCSS',
    'Vue': 'VUE',
    'Svelte': 'SVELTE',
    'Shell': 'SHELL',
    'Dockerfile': 'DOCKER',
  };

  return Object.keys(languages)
    .filter(lang => tagMap[lang])
    .map(lang => tagMap[lang])
    .slice(0, 5); // Limit to top 5 languages
}

/**
 * Categorize repository based on description and topics
 */
function categorizeRepo(repo, readme) {
  const description = (repo.description || '').toLowerCase();
  const topics = (repo.topics || []).join(' ').toLowerCase();
  const readmeText = (readme || '').toLowerCase();
  const combined = `${description} ${topics} ${readmeText.slice(0, 500)}`;

  // Machine Learning / AI
  if (
    /\b(machine learning|deep learning|neural network|ai|ml|transformer|model|pytorch|tensorflow|llm|nlp)\b/i.test(combined)
  ) {
    return 'system_ml';
  }

  // Default category
  return 'system_ml';
}

/**
 * Process a repository into portfolio entry format
 */
async function processRepo(repo) {
  console.log(`\n📄 Processing: ${repo.name}`);

  // Fetch README
  const readme = await fetchReadme(GITHUB_USERNAME, repo.name);
  
  // Extract description
  let summary = extractDescription(readme);
  
  // Fallback to GitHub description
  if (!summary && repo.description) {
    summary = repo.description;
  }
  
  // Final fallback
  if (!summary) {
    summary = `A ${repo.language || 'software'} project`;
  }

  // Fetch languages
  let languages = {};
  try {
    languages = await githubRequest(`/repos/${GITHUB_USERNAME}/${repo.name}/languages`);
  } catch (error) {
    console.warn(`   ⚠️  Could not fetch languages`);
  }

  const techTags = mapLanguagesToTags(languages);
  const category = categorizeRepo(repo, readme);

  const entry = {
    id: repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    type: category,
    title: repo.name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    summary: summary.slice(0, 300), // Limit length
    tech_tags: techTags,
    github_url: repo.html_url,
    live_url: repo.homepage || null,
    year: new Date(repo.created_at).getFullYear(),
  };

  console.log(`   ✅ Title: ${entry.title}`);
  console.log(`   ✅ Summary: ${entry.summary.slice(0, 60)}...`);
  console.log(`   ✅ Tags: ${entry.tech_tags.join(', ')}`);

  return entry;
}

/**
 * Save entries to local JSON
 */
function saveToLocal(entries) {
  const outputPath = path.join(__dirname, '..', 'lib', 'data', 'portfolio-entries.json');
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));
  console.log(`\n💾 Saved ${entries.length} entries to lib/data/portfolio-entries.json`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 GitHub Repository Fetch Script\n');
  console.log(`👤 GitHub User: ${GITHUB_USERNAME}\n`);

  // Fetch repositories
  const repos = await fetchUserRepos(GITHUB_USERNAME);

  if (repos.length === 0) {
    console.warn('⚠️  No repositories found');
    process.exit(0);
  }

  // Process each repository
  const entries = [];
  for (const repo of repos) {
    try {
      const entry = await processRepo(repo);
      entries.push(entry);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`   ❌ Failed to process ${repo.name}:`, error.message);
    }
  }

  if (entries.length === 0) {
    console.error('❌ No entries processed successfully');
    process.exit(1);
  }

  // Save to local file
  saveToLocal(entries);

  console.log('\n✅ GitHub fetch completed successfully');
  console.log(`📈 Processed ${entries.length} repositories`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Check lib/data/portfolio-entries.json`);
  console.log(`   2. Run 'npm run dev' to see your projects in the app`);
  console.log(`   3. Set up Supabase credentials to enable cloud sync\n`);
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
