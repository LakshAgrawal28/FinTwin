import axios from 'axios';
import dotenv from 'dotenv';

// 🔥 Load environment variables
dotenv.config();

async function testClaude() {
  try {
    console.log("🔍 Checking API Key...\n");

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // ✅ Step 1: Check if key exists
    if (!apiKey) {
      console.error("❌ ERROR: API Key is UNDEFINED");
      console.log("👉 Fix: Check your .env file and dotenv.config()");
      return;
    }

    console.log("✅ API Key Loaded:", apiKey.substring(0, 10) + "...\n");

    // ✅ Step 2: Make test request
    console.log("📡 Sending test request to Claude...\n");

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307", // safe model
        max_tokens: 50,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Say hello in one sentence." }
            ]
          }
        ]
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );

    // ✅ Step 3: Success
    console.log("✅ SUCCESS! Claude Response:\n");
    console.log(response.data.content[0].text);

  } catch (error) {
    console.error("❌ CLAUDE API ERROR:\n");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }

    console.log("\n🛠️ What this means:");

    if (error.response?.status === 401) {
      console.log("👉 Invalid API Key or missing permissions");
    } else if (error.response?.status === 400) {
      console.log("👉 Bad request (model/format issue)");
    } else if (error.response?.status === 404) {
      console.log("👉 Wrong API endpoint or model");
    } else {
      console.log("👉 Unknown issue — check error above");
    }
  }
}

testClaude();