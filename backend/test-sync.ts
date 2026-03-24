import { AcademicSyncService } from "./src/services/academicSyncService";

async function test() {
    console.log("🚀 Testing AcademicSyncService...");
    try {
        console.log("1. Fetching Captcha...");
        const result = await AcademicSyncService.getCaptcha();
        console.log("✅ Captcha fetched successfully!");
        console.log("Sync ID:", result.syncId);
        console.log("Captcha Base64 length:", result.captchaBase64.length);
    } catch (error: any) {
        console.error("❌ Error during test:", error.message || error);
        if (error.stack) console.error(error.stack);
    }
}

test();
