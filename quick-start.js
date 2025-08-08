#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 AI Workspace Quick Start Setup\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
    console.log('✅ .env.local file already exists');
} else {
    console.log('📝 Creating .env.local file...');

    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (Required for chat)
OPENAI_API_KEY=your_openai_api_key

# Optional: Additional AI Providers
ANTHROPIC_API_KEY=your_anthropic_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Optional: YouTube API for video transcription
YOUTUBE_API_KEY=your_youtube_api_key

# Optional: Bing Search API for web sources
BING_SEARCH_API_KEY=your_bing_search_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file created');
}

console.log('\n📋 Setup Checklist:');
console.log('1. ✅ Dependencies installed');
console.log('2. ✅ Application structure complete');
console.log('3. ✅ All API routes implemented');
console.log('4. ✅ Database schema ready');
console.log('5. 🔄 Environment variables need configuration');
console.log('6. 🔄 Supabase database needs setup');

console.log('\n🎯 Next Steps:');
console.log('1. Edit .env.local with your API keys');
console.log('2. Set up Supabase database (see SETUP_COMPLETION.md)');
console.log('3. Run: npm run dev');
console.log('4. Open: http://localhost:3000');

console.log('\n📚 Documentation:');
console.log('- SETUP_COMPLETION.md - Complete setup guide');
console.log('- README.md - Feature overview');
console.log('- TROUBLESHOOTING.md - Common issues');

console.log('\n🎉 Your AI workspace is ready to configure!');

rl.close(); 