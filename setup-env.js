#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 AI Workspace App - Environment Setup\n');

const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

// Check if .env.local already exists
if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists!');
    rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            createEnvFile();
        } else {
            console.log('Setup cancelled.');
            rl.close();
        }
    });
} else {
    createEnvFile();
}

function createEnvFile() {
    console.log('\n📝 Setting up environment variables...\n');

    const envVars = {
        'NEXT_PUBLIC_SUPABASE_URL': 'your_supabase_project_url',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'your_supabase_anon_key',
        'SUPABASE_SERVICE_ROLE_KEY': 'your_supabase_service_role_key',
        'OPENAI_API_KEY': 'your_openai_api_key',
        'ANTHROPIC_API_KEY': 'your_anthropic_api_key',
        'MISTRAL_API_KEY': 'your_mistral_api_key',
        'YOUTUBE_API_KEY': 'your_youtube_api_key',
        'BING_SEARCH_API_KEY': 'your_bing_search_api_key',
        'PINECONE_API_KEY': 'your_pinecone_api_key',
        'PINECONE_ENVIRONMENT': 'your_pinecone_environment',
        'NEXT_PUBLIC_APP_URL': 'http://localhost:3000',
        'NEXTAUTH_SECRET': 'your_nextauth_secret',
        'NEXTAUTH_URL': 'http://localhost:3000'
    };

    let envContent = '# AI Workspace App Environment Variables\n\n';

    Object.entries(envVars).forEach(([key, defaultValue]) => {
        envContent += `${key}=${defaultValue}\n`;
    });

    fs.writeFileSync(envPath, envContent);

    console.log('✅ .env.local file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Edit .env.local and replace the placeholder values with your actual API keys');
    console.log('2. At minimum, you need:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase)');
    console.log('   - OPENAI_API_KEY (from OpenAI)');
    console.log('3. Run "npm run dev" to start the application');
    console.log('\n📖 For detailed setup instructions, see SETUP_COMPLETION.md');

    rl.close();
} 