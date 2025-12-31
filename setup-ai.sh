#!/bin/bash
# Civix AI Setup Script

echo "🚀 Civix AI Setup"
echo "================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file"
  echo ""
  echo "⚠️  IMPORTANT: Add your API keys to .env before continuing!"
  echo ""
  echo "Get API keys from:"
  echo "  - Gemini: https://makersuite.google.com/app/apikey"
  echo "  - Claude: https://console.anthropic.com/"
  echo "  - OpenAI: https://platform.openai.com/api-keys"
  echo ""
  read -p "Press Enter when you've added your API keys to .env..."
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Updating database schema..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Verify API keys in .env"
echo "  2. Run: npm run dev"
echo "  3. Visit: http://localhost:3000/ask"
echo "  4. Ask a question!"
echo ""
echo "See AI_SETUP.md for detailed documentation."
