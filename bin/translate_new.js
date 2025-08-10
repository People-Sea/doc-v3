// 执行参数
import OpenAI from "openai";
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import process from "node:process";

process.noDeprecation = true;
const endpoint = "https://api.deepseek.com";
const token = process.env["DEEPSEEK_API_KEY"] || 'sk-519bcdd33431437d9f5709d64231e82b';
const MAX_CONCURRENT = 10; // 最大并发数
const MAX_RETRIES = 3; // 最大重试次数
const CHANGE_FILES = process.env["CHANGE_FILES"]?.split('\n') ||  ['docs/zh/index.md'];
const SOURCE_DIRS = ['docs', '.vitepress/src'];
const SOURCE_LANG = 'zh'; // 源语言

const SUPPORTED_LANGUAGES = {
    'en': {
        name: 'English',
        systemPrompt: {
            md: 'You are a professional technical translator. Translate Simplified Chinese to English. Rules: do not change markdown syntax, code fences, inline code, front-matter keys, or link targets (URLs/paths). Do not translate code blocks. Only translate human-readable text. Do not add explanations.',
            code: 'You are a professional technical translator. Translate only comments and string literals from Simplified Chinese to English. NEVER alter code tokens, identifiers, imports/exports, types, or file paths. Preserve formatting exactly. Do not add explanations.'
        }
    },
    'ja': {
        name: 'Japanese',
        systemPrompt: {
            md: 'You are a professional technical translator. Translate Simplified Chinese to Japanese. Rules: do not change markdown syntax, code fences, inline code, front-matter keys, or link targets (URLs/paths). Do not translate code blocks. Only translate human-readable text. Do not add explanations.',
            code: 'You are a professional technical translator. Translate only comments and string literals from Simplified Chinese to Japanese. NEVER alter code tokens, identifiers, imports/exports, types, or file paths. Preserve formatting exactly. Do not add explanations.'
        }
    }
};

if (!token) {
    console.error("❌ 请设置环境变量 DEEPSEEK_API_KEY");
    process.exit(1);
}

const openai = new OpenAI({
    baseURL: endpoint,
    apiKey: token,
});


// 业务函数定义开始
async function translateWithRetry(content, retries = 0,systemContent = '') {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemContent },
                { role: "user", content: content }
            ],
            model: "deepseek-chat",
        });
        return completion.choices[0].message.content;
    } catch (error) {
        if (retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
            return translateWithRetry(content, retries + 1, systemContent);
        }
        throw error;
    }
}

// analyzeTranslationStatus
async function readFiles(dir) {
    let sources = await readdir(dir, { recursive: true });
    return sources.filter(file => file.endsWith('.md') || file.endsWith('.js') || file.endsWith('.ts'));
}

async function handle() {
    // 先扫描zh目录，获取所有需要处理的文件
    let targetLanguages = Object.keys(SUPPORTED_LANGUAGES);
    console.log(`🌐 Supported languages: ${targetLanguages.join(', ')}`);
    console.log('----------------------------------------');
    for (const dir of SOURCE_DIRS) {
        let source_lang_dir = `${dir}/${SOURCE_LANG}`;
        let sourceFiles;
        let changeFilesInDir = CHANGE_FILES
            .filter(file => file.startsWith(source_lang_dir))
            .map(file => file.replace(`${source_lang_dir}/`, ''));
        console.log(changeFilesInDir)
        console.log(`\n📁 Directory: ${dir}`);
        try {
            sourceFiles = await readFiles(source_lang_dir);
            console.log(`  - ✅ Found ${sourceFiles.length} source files in ${source_lang_dir}`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`  - 🟡 Source directory not found: ${source_lang_dir}`);
                continue;
            }
            throw error;
        }

        for (const lang of targetLanguages) {
            if (lang === SOURCE_LANG) continue;
            let target_lang_dir = `${dir}/${lang}`;
            try {
                // 如果没有目录就创建
                await mkdir(target_lang_dir, { recursive: true });
                let targetFiles = await readFiles(target_lang_dir);
                let filesToTranslate = sourceFiles.filter(file => !targetFiles.includes(file));
                let orphanFiles = targetFiles.filter(file => !sourceFiles.includes(file));


                console.log(`  - 🌍 Language: ${lang}`);
                console.log(`    - 📝 Untranslated files: ${filesToTranslate.length}`);
                console.log(`    - 🤷 Orphan files: ${orphanFiles.length}`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log(`  - 🌍 Language: ${lang}`);
                    console.log(`    - 🟡 Target directory not found: ${target_lang_dir}`);
                    console.log(`    - 📝 Untranslated files: ${sourceFiles.length}`);
                    console.log(`    - 🤷 Orphan files: 0`);
                } else {
                    throw error;
                }
            }
        }
        console.log('----------------------------------------');
    }
}

async function main() {
    try {
        await handle();
    } catch (error) {
        console.error('❌ 处理过程中发生错误:', error.message);
        process.exit(1);
    }
}

await main();