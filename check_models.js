import fs from 'fs';
import path from 'path';

async function check() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.error("❌ Error: Could not find .env file.");
      process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    
    if (!match || !match[1]) {
      console.error("❌ Error: VITE_GEMINI_API_KEY not found in .env");
      process.exit(1);
    }

    // SANITIZATION: Remove spaces AND quotes (" or ') from the key
    const rawKey = match[1].trim();
    const apiKey = rawKey.replace(/^["']|["']$/g, ''); 

    console.log(`🔑 Testing Key: ${apiKey.substring(0, 6)}... (Length: ${apiKey.length})`);

    // Query Google
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const contentModels = data.models.filter(m => 
      m.supportedGenerationMethods.includes("generateContent")
    );

    console.log("\n✅ SUCCESS! HERE ARE YOUR AVAILABLE MODELS:");
    console.table(contentModels.map(m => ({
      name: m.name.replace('models/', ''), // Use THIS string in your code
      version: m.version,
      displayName: m.displayName
    })));

  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

check();