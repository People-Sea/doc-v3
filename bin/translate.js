import OpenAI from "openai";
import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import process from "process";
import { execSync } from 'child_process';

const endpoint = "https://api.deepseek.com";
const token = process.env["DEEPSEEK_API_KEY"] || 'sk-f4e477c6b16b4401849a3e4ae8f26c50';
const MAX_CONCURRENT = 10; // 最大并发数
const MAX_RETRIES = 3; // 最大重试次数
if (!token) {
    console.error('❌ 未设置环境变量 DEEPSEEK_API_KEY');
    process.exit(1);
}
// 支持的语言配置
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

const openai = new OpenAI({
    baseURL: endpoint,
    apiKey: token,
});

async function translateWithRetry(content, retries = 0,systemContent = 'You are a professional translator. Translate the following Chinese markdown content to English. Keep all markdown formatting intact.') {
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
            return translateWithRetry(content, retries + 1,systemContent);
        }
        throw error;
    }
}

async function processFile(srcPath, destPath, targetLang = 'en') {
    const destFolder = path.dirname(destPath);
    await mkdir(destFolder, { recursive: true });
    const content = await readFile(srcPath, 'utf8');

    const langConfig = SUPPORTED_LANGUAGES[targetLang];
    if (!langConfig) {
        throw new Error(`Unsupported language: ${targetLang}`);
    }

    let systemContent;
    if (srcPath.endsWith('.ts') || srcPath.endsWith('.js')) {
        systemContent = langConfig.systemPrompt.code;
    } else if (srcPath.endsWith('.md')) {
        systemContent = langConfig.systemPrompt.md;
    } else {
        systemContent = langConfig.systemPrompt.md; // 默认使用md提示
    }

    const translatedContent = await translateWithRetry(content, 0, systemContent);
    const finalContent = replaceZhLinks(translatedContent, targetLang);
    await writeFile(destPath, finalContent);
    console.log(`Translated: ${path.basename(srcPath)} to ${targetLang}`);
}

function replaceZhLinks(content, lang) {
    // Markdown 链接: [text](/zh/xxx)
    content = content.replace(/(]\()\/zh\//g, `$1/${lang}/`);
    // 行内链接: (/zh/xxx)
    content = content.replace(/(\()\/zh\//g, `$1/${lang}/`);
    // HTML 属性: href="/zh/xxx" 或 to="/zh/xxx"
    content = content.replace(/(\b(?:href|to)=["'])\/zh\//g, `$1/${lang}/`);
    return content;
}
/**
 * 检查文件是否存在且不为空
 */
async function fileExistsAndNotEmpty(filePath) {
    try {
        const stats = await stat(filePath);
        if (stats.size === 0) {
            return false;
        }
        // 对于markdown文件，检查是否有实质内容
        if (filePath.endsWith('.md')) {
            const content = await readFile(filePath, 'utf8');
            const trimmedContent = content.trim();
            return trimmedContent.length > 0 && trimmedContent !== '# ';
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function listFilesRecursive(root) {
    const out = [];
    async function walk(dir, relBase = '') {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const e of entries) {
            const rel = relBase ? `${relBase}/${e.name}` : e.name;
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
                await walk(full, rel);
            } else {
                out.push(rel);
            }
        }
    }
    await walk(root);
    return out;
}
/**
 * 统一的翻译状态检查函数
 */
async function analyzeTranslationStatus(srcDir, destDir, targetLang, changedChineseFiles = []) {
    try {
        const sourceFiles = await listFilesRecursive(srcDir);
        const allSourceFiles = sourceFiles.filter(file => file.endsWith('.ts') || file.endsWith('.md'));

        // 检查目标目录中的文件，用于检测孤儿文件
        let targetFiles = [];
        try {
            targetFiles = await listFilesRecursive(destDir);
            targetFiles = targetFiles.filter(file => file.endsWith('.ts') || file.endsWith('.md'));
        } catch (error) {
            // 目标目录不存在时忽略
        }

        const missingFiles = [];
        const emptyFiles = [];
        const existingFiles = [];
        const gitChangedFiles = [];
        const outdatedFiles = [];
        const orphanFiles = [];

        // 检查源文件对应的翻译状态
        for (const file of allSourceFiles) {
            const srcPath = path.join(srcDir, file);
            const destPath = path.join(destDir, file);

            const srcStat = await stat(srcPath);
            const destStat = await stat(destPath).catch(() => null);
            const existsAndNotEmpty = await fileExistsAndNotEmpty(destPath);
            const isGitChanged = shouldForceTranslate(file, changedChineseFiles);

            if (!existsAndNotEmpty) {
                const fileExists = await stat(destPath).then(() => true).catch(() => false);
                if (fileExists) {
                    emptyFiles.push(file);
                } else {
                    missingFiles.push(file);
                }
            } else if (isGitChanged) {
                gitChangedFiles.push(file);
                existingFiles.push(file);
            } else if (destStat && srcStat.mtimeMs > destStat.mtimeMs) {
                outdatedFiles.push(file);
                existingFiles.push(file);
            } else {
                existingFiles.push(file);
            }
        }

        // 检测孤儿文件（目标目录中存在但源目录中不存在的文件）
        for (const file of targetFiles) {
            if (!allSourceFiles.includes(file)) {
                orphanFiles.push(file);
            }
        }

        const totalFiles = allSourceFiles.length;
        const translatedCount = existingFiles.length;
        const needsTranslation = missingFiles.length + emptyFiles.length + gitChangedFiles.length + outdatedFiles.length;
        const completionRate = totalFiles > 0 ? ((translatedCount / totalFiles) * 100).toFixed(2) : 100;

        return {
            total: totalFiles,
            translated: translatedCount,
            missing: missingFiles.length,
            empty: emptyFiles.length,
            gitChanged: gitChangedFiles.length,
            outdated: outdatedFiles.length,
            orphan: orphanFiles.length,
            needsTranslation,
            completionRate: parseFloat(completionRate),
            filesToTranslate: [...missingFiles, ...emptyFiles, ...gitChangedFiles, ...outdatedFiles],
            orphanFiles,
            // 添加详细的文件列表
            missingFilesList: missingFiles,
            emptyFilesList: emptyFiles,
            gitChangedFilesList: gitChangedFiles,
            outdatedFilesList: outdatedFiles,
            complete: needsTranslation === 0
        };
    } catch (error) {
        console.warn(`⚠️  无法访问源目录 ${srcDir}: ${error.message}`);
        return {
            total: 0,
            translated: 0,
            missing: 0,
            empty: 0,
            gitChanged: 0,
            outdated: 0,
            orphan: 0,
            needsTranslation: 0,
            completionRate: 100,
            filesToTranslate: [],
            orphanFiles: [],
            // 添加详细的文件列表
            missingFilesList: [],
            emptyFilesList: [],
            gitChangedFilesList: [],
            outdatedFilesList: [],
            complete: true,
            error: error.message
        };
    }
}

async function translateFiles(srcDir, destDir, targetLang = 'en', translateAll = false, changedChineseFiles = []) {
    try {
        let filesToTranslate;

        if (translateAll) {
            const files = await readdir(srcDir, { recursive: true });
            filesToTranslate = files.filter(file => file.endsWith('.ts') || file.endsWith('.md'));
            console.log(`📝 翻译模式: 全量翻译 (${filesToTranslate.length}个文件)`);
        } else {
            const analysis = await analyzeTranslationStatus(srcDir, destDir, targetLang, changedChineseFiles);
            filesToTranslate = analysis.filesToTranslate;

            // 为单个目录显示状态时，创建虚拟的vitepress结果
            const emptyResult = {
                total: 0, translated: 0, missing: 0, empty: 0, gitChanged: 0, outdated: 0, orphan: 0,
                missingFilesList: [], emptyFilesList: [], gitChangedFilesList: [], outdatedFilesList: [], orphanFiles: []
            };

            // 根据srcDir判断是docs还是vitepress，相应地分配结果
            if (srcDir.includes('docs/zh')) {
                displayTranslationStatus(analysis, emptyResult, targetLang, 'translate');
            } else {
                displayTranslationStatus(emptyResult, analysis, targetLang, 'translate');
            }
        }

        if (filesToTranslate.length === 0) {
            console.log(`✅ ${targetLang.toUpperCase()} 翻译已是最新，无需翻译`);
            return;
        }

        console.log(`🚀 开始翻译 ${filesToTranslate.length} 个文件到 ${targetLang.toUpperCase()}...`);

        // 将文件分批处理
        for (let i = 0; i < filesToTranslate.length; i += MAX_CONCURRENT) {
            const batch = filesToTranslate.slice(i, i + MAX_CONCURRENT);
            const promises = batch.map(file => {
                const srcPath = path.join(srcDir, file);
                const destPath = path.join(destDir, file);
                return processFile(srcPath, destPath, targetLang).catch(error => {
                    console.error(`Error translating ${file}:`, error);
                });
            });

            await Promise.all(promises);
        }

        console.log(`✅ ${targetLang.toUpperCase()} 翻译完成! (${filesToTranslate.length}个文件)`);
    } catch (error) {
        console.error('Translation error:', error);
    }
}

/**
 * 解析命令行参数
 */
function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        languages: [], // 要翻译的语言列表
        help: false,
        translateAll: false, // 是否翻译所有文件
        checkOnly: false // 只检测不翻译
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--language':
            case '-l':
                if (i + 1 < args.length) {
                    const lang = args[i + 1];
                    if (SUPPORTED_LANGUAGES[lang]) {
                        options.languages.push(lang);
                        i++; // 跳过下一个参数
                    } else {
                        console.error(`❌ 不支持的语言: ${lang}`);
                        console.error(`支持的语言: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
                        process.exit(1);
                    }
                } else {
                    console.error('❌ --language 参数需要指定语言代码');
                    process.exit(1);
                }
                break;

            case '--all':
            case '-a':
                options.translateAll = true;
                break;

            case '--check':
            case '-c':
                options.checkOnly = true;
                break;

            case '--help':
            case '-h':
                options.help = true;
                break;

            default:
                // 直接指定语言代码
                if (SUPPORTED_LANGUAGES[arg]) {
                    options.languages.push(arg);
                } else {
                    console.error(`❌ 未知参数或不支持的语言: ${arg}`);
                    process.exit(1);
                }
        }
    }

    return options;
}

/**
 * 显示帮助信息
 */
function showHelp() {
    console.log('🌐 AI翻译工具');
    console.log('');
    console.log('用法:');
    console.log('  node bin/translate.js [选项] [语言代码...]');
    console.log('');
    console.log('选项:');
    console.log('  -l, --language <lang>    指定要翻译的语言');
    console.log('  -a, --all               翻译所有文件(默认只翻译缺失的文件)');
    console.log('  -c, --check             只检查翻译状态，不执行翻译');
    console.log('  -h, --help              显示帮助信息');
    console.log('');
    console.log('支持的语言:');
    Object.entries(SUPPORTED_LANGUAGES).forEach(([code, config]) => {
        console.log(`  ${code.padEnd(4)} ${config.name}`);
    });
    console.log('');
    console.log('模式说明:');
    console.log('  默认模式: 智能增量翻译，只翻译缺失或空的文件');
    console.log('  --all:   全量翻译，重新翻译所有文件');
    console.log('  --check: 只检查翻译状态，生成报告但不执行翻译');
    console.log('');
    console.log('示例:');
    console.log('  pnpm run docs:translate en               # 智能翻译英文(只翻译缺失文件)');
    console.log('  pnpm run docs:translate en --all         # 全量翻译英文');
    console.log('  pnpm run docs:translate en --check       # 检查英文翻译状态');
    console.log('  pnpm run docs:translate --check          # 检查所有语言翻译状态');
    console.log('  pnpm run docs:translate                  # 智能翻译所有语言');
}

/**
 * 执行检查任务
 */
async function executeCheck(languages) {
    console.log(`🔍 开始检查翻译状态...`);
    console.log(`📝 检查语言: ${languages.map(lang => SUPPORTED_LANGUAGES[lang].name).join(', ')}`);

    // 获取Git变更的中文文档
    const changedChineseFiles = await getChangedChineseFiles();

    const results = [];

    for (const lang of languages) {
        console.log(`\n🔄 检查 ${SUPPORTED_LANGUAGES[lang].name} (${lang})...`);

        // 检查文档文件（传入Git变更信息）
        const docsResult = await analyzeTranslationStatus('docs/zh', `docs/${lang}`, lang, changedChineseFiles);

        // 检查VitePress配置文件（传入Git变更信息）
        const vitepressResult = await analyzeTranslationStatus('.vitepress/src/zh', `.vitepress/src/${lang}`, lang, changedChineseFiles);

        // 统一的文件列表显示函数
        const displayTranslationStatus = (docsResult, vitepressResult, lang, mode = 'check') => {
            const totalResult = {
                language: lang,
                name: SUPPORTED_LANGUAGES[lang].name,
                docs: docsResult,
                vitepress: vitepressResult,
                overall: {
                    total: docsResult.total + vitepressResult.total,
                    translated: docsResult.translated + vitepressResult.translated,
                    missing: docsResult.missing + vitepressResult.missing,
                    empty: docsResult.empty + vitepressResult.empty,
                    gitChanged: docsResult.gitChanged + vitepressResult.gitChanged,
                    outdated: docsResult.outdated + vitepressResult.outdated,
                    orphan: docsResult.orphan + vitepressResult.orphan,
                    complete: docsResult.complete && vitepressResult.complete
                }
            };

            totalResult.overall.completionRate = totalResult.overall.total > 0
                ? ((totalResult.overall.translated / totalResult.overall.total) * 100).toFixed(2)
                : 100;

            // 显示基本统计信息
            const modeText = mode === 'check' ? '翻译详细统计' : '翻译模式: 智能增量翻译';
            console.log(`📊 ${modeText}:`);
            console.log(`   📄 总文件: ${totalResult.overall.total}个`);
            console.log(`   ✅ 已翻译: ${totalResult.overall.translated}个 (${totalResult.overall.completionRate}%)`);
            console.log(`   ❌ 缺失文件: ${totalResult.overall.missing}个`);
            console.log(`   ⚠️  空文件: ${totalResult.overall.empty}个`);
            console.log(`   🗑️  孤儿文件: ${totalResult.overall.orphan}个${totalResult.overall.orphan > 0 ? ' (建议清理)' : ''}`);
            console.log(`   🔄 Git变更: ${totalResult.overall.gitChanged}个`);
            console.log(`   ⏰ 过期文件: ${totalResult.overall.outdated}个`);
            if (mode === 'translate') {
                console.log(`   ❌ 需翻译: ${totalResult.overall.missing + totalResult.overall.empty + totalResult.overall.gitChanged + totalResult.overall.outdated}个`);
            }

            // 显示详细文件列表
            const showFileList = (title, files) => {
                if (files.length > 0) {
                    console.log(`\n${title}:`);
                    files.forEach(file => {
                        console.log(`     ${file}`);
                    });
                }
            };

            // 合并docs和vitepress的文件列表，添加完整路径
            const allMissingFiles = [
                ...(docsResult.missingFilesList || []).map(f => `docs/${lang}/${f}`),
                ...(vitepressResult.missingFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
            ];
            const allEmptyFiles = [
                ...(docsResult.emptyFilesList || []).map(f => `docs/${lang}/${f}`),
                ...(vitepressResult.emptyFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
            ];
            const allOrphanFiles = [
                ...(docsResult.orphanFiles || []).map(f => `docs/${lang}/${f}`),
                ...(vitepressResult.orphanFiles || []).map(f => `.vitepress/src/${lang}/${f}`)
            ];
            const allGitChangedFiles = [
                ...(docsResult.gitChangedFilesList || []).map(f => `docs/${lang}/${f}`),
                ...(vitepressResult.gitChangedFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
            ];
            const allOutdatedFiles = [
                ...(docsResult.outdatedFilesList || []).map(f => `docs/${lang}/${f}`),
                ...(vitepressResult.outdatedFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
            ];

            showFileList(`   📋 缺失文件列表`, allMissingFiles);
            showFileList(`   📋 空文件列表`, allEmptyFiles);
            showFileList(`   📋 孤儿文件列表`, allOrphanFiles);
            showFileList(`   📋 Git变更文件列表`, allGitChangedFiles);
            showFileList(`   📋 过期文件列表`, allOutdatedFiles);

            return totalResult;
        };

        const totalResult = displayTranslationStatus(docsResult, vitepressResult, lang, 'check');
        results.push(totalResult);
    }

    // 生成汇总报告
    console.log(`\n📊 翻译状态汇总报告:`);
    console.log('='.repeat(60));

    const completeLanguages = results.filter(r => r.overall.complete);
    const incompleteLanguages = results.filter(r => !r.overall.complete);

    if (completeLanguages.length > 0) {
        console.log(`✅ 完整翻译 (${completeLanguages.length}): ${completeLanguages.map(r => r.language.toUpperCase()).join(', ')}`);
    }

    if (incompleteLanguages.length > 0) {
        console.log(`⚠️  不完整翻译 (${incompleteLanguages.length}):`);
        incompleteLanguages.forEach(r => {
            const needsUpdate = r.overall.gitChanged + r.overall.outdated;
            const summary = `缺失: ${r.overall.missing + r.overall.empty}个文件${needsUpdate > 0 ? `, 需更新: ${needsUpdate}个` : ''}`;
            console.log(`   - ${r.language.toUpperCase()}: ${r.overall.completionRate}% (${summary})`);
        });

        console.log(`\n💡 建议操作:`);
        incompleteLanguages.forEach(r => {
            if (r.overall.missing > 0 || r.overall.empty > 0 || r.overall.gitChanged > 0 || r.overall.outdated > 0) {
                console.log(`   - 翻译 ${r.language.toUpperCase()}: pnpm run docs:translate ${r.language}`);
            }
        });
    }

    return results;
}

/**
 * 执行翻译任务
 */
async function executeTranslation(languages, translateAll = false) {
    console.log(`🚀 开始翻译任务...`);
    console.log(`📝 目标语言: ${languages.map(lang => SUPPORTED_LANGUAGES[lang].name).join(', ')}`);
    console.log(`🔧 翻译模式: ${translateAll ? '全量翻译' : '智能增量翻译'}`);

    // 获取Git变更的中文文档
    const changedChineseFiles = await getChangedChineseFiles();

    for (const lang of languages) {
        console.log(`\n🔄 开始翻译 ${SUPPORTED_LANGUAGES[lang].name} (${lang})...`);

        // 翻译文档文件（传入Git变更信息）
        await translateFiles('docs/zh', `docs/${lang}`, lang, translateAll, changedChineseFiles);

        // 翻译VitePress配置文件（传入Git变更信息）
        await translateFiles('.vitepress/src/zh', `.vitepress/src/${lang}`, lang, translateAll, changedChineseFiles);

        console.log(`✅ ${SUPPORTED_LANGUAGES[lang].name} 翻译完成!`);
    }

    console.log(`\n🎉 所有翻译任务完成!`);
}

/**
 * 获取Git中变更的中文文档文件
 */
async function getChangedChineseFiles() {
    try {
        // 获取相对于HEAD的变更文件，包括暂存和未暂存的
        const gitDiffOutput = execSync('git diff --name-only HEAD docs/zh/', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();

        const gitDiffCachedOutput = execSync('git diff --cached --name-only docs/zh/', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();

        const changedFiles = new Set();

        // 添加工作区变更的文件
        if (gitDiffOutput) {
            gitDiffOutput.split('\n').forEach(file => {
                if (file.endsWith('.md') || file.endsWith('.ts')) {
                    changedFiles.add(file);
                }
            });
        }

        // 添加暂存区变更的文件
        if (gitDiffCachedOutput) {
            gitDiffCachedOutput.split('\n').forEach(file => {
                if (file.endsWith('.md') || file.endsWith('.ts')) {
                    changedFiles.add(file);
                }
            });
        }

        return Array.from(changedFiles);
    } catch (error) {
        console.warn(`⚠️  Git检测失败: ${error.message}`);
        return [];
    }
}

/**
 * 检查文件是否需要强制翻译（基于Git变更）
 */
function shouldForceTranslate(file, changedChineseFiles) {
    if (changedChineseFiles.length === 0) {
        return false;
    }

    // 将目标文件路径转换为对应的中文源文件路径
    const chineseFilePath = file.replace(/\.(ts|md)$/, '.$1');

    return changedChineseFiles.some(changedFile => {
        // 移除 docs/zh/ 前缀，只比较相对路径
        const relativePath = changedFile.replace('docs/zh/', '');
        return file === relativePath;
    });
}

/**
 * 主函数
 */
async function main() {
    try {
        const options = parseArguments();

        if (options.help) {
            showHelp();
            return;
        }

        // 如果没有指定语言，默认处理所有语言
        const targetLanguages = options.languages.length > 0
            ? options.languages
            : Object.keys(SUPPORTED_LANGUAGES);

        if (options.checkOnly) {
            // 只检查模式
            const results = await executeCheck(targetLanguages);

            // 如果有不完整的翻译，设置退出码
            const hasIncomplete = results.some(r => !r.overall.complete);
            if (hasIncomplete) {
                process.exit(1);
            }
        } else {
            // 翻译模式
            await executeTranslation(targetLanguages, options.translateAll);
        }

    } catch (error) {
        console.error('❌ 处理过程中发生错误:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本，执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

/**
 * 统一的翻译状态显示函数
 */
function displayTranslationStatus(docsResult, vitepressResult, lang, mode = 'check') {
    const totalResult = {
        language: lang,
        name: SUPPORTED_LANGUAGES[lang].name,
        docs: docsResult,
        vitepress: vitepressResult,
        overall: {
            total: docsResult.total + vitepressResult.total,
            translated: docsResult.translated + vitepressResult.translated,
            missing: docsResult.missing + vitepressResult.missing,
            empty: docsResult.empty + vitepressResult.empty,
            gitChanged: docsResult.gitChanged + vitepressResult.gitChanged,
            outdated: docsResult.outdated + vitepressResult.outdated,
            orphan: docsResult.orphan + vitepressResult.orphan,
            complete: docsResult.complete && vitepressResult.complete
        }
    };

    totalResult.overall.completionRate = totalResult.overall.total > 0
        ? ((totalResult.overall.translated / totalResult.overall.total) * 100).toFixed(2)
        : 100;

    // 显示基本统计信息
    const modeText = mode === 'check' ? '翻译详细统计' : '翻译模式: 智能增量翻译';
    console.log(`📊 ${modeText}:`);
    console.log(`   📄 总文件: ${totalResult.overall.total}个`);
    console.log(`   ✅ 已翻译: ${totalResult.overall.translated}个 (${totalResult.overall.completionRate}%)`);
    console.log(`   ❌ 缺失文件: ${totalResult.overall.missing}个`);
    console.log(`   ⚠️  空文件: ${totalResult.overall.empty}个`);
    console.log(`   🗑️  孤儿文件: ${totalResult.overall.orphan}个${totalResult.overall.orphan > 0 ? ' (建议清理)' : ''}`);
    console.log(`   🔄 Git变更: ${totalResult.overall.gitChanged}个`);
    console.log(`   ⏰ 过期文件: ${totalResult.overall.outdated}个`);
    if (mode === 'translate') {
        console.log(`   ❌ 需翻译: ${totalResult.overall.missing + totalResult.overall.empty + totalResult.overall.gitChanged + totalResult.overall.outdated}个`);
    }

    // 显示详细文件列表
    const showFileList = (title, files) => {
        if (files.length > 0) {
            console.log(`\n${title}:`);
            files.forEach(file => {
                console.log(`     ${file}`);
            });
        }
    };

    // 合并docs和vitepress的文件列表，添加完整路径
    const allMissingFiles = [
        ...(docsResult.missingFilesList || []).map(f => `docs/${lang}/${f}`),
        ...(vitepressResult.missingFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
    ];
    const allEmptyFiles = [
        ...(docsResult.emptyFilesList || []).map(f => `docs/${lang}/${f}`),
        ...(vitepressResult.emptyFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
    ];
    const allOrphanFiles = [
        ...(docsResult.orphanFiles || []).map(f => `docs/${lang}/${f}`),
        ...(vitepressResult.orphanFiles || []).map(f => `.vitepress/src/${lang}/${f}`)
    ];
    const allGitChangedFiles = [
        ...(docsResult.gitChangedFilesList || []).map(f => `docs/${lang}/${f}`),
        ...(vitepressResult.gitChangedFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
    ];
    const allOutdatedFiles = [
        ...(docsResult.outdatedFilesList || []).map(f => `docs/${lang}/${f}`),
        ...(vitepressResult.outdatedFilesList || []).map(f => `.vitepress/src/${lang}/${f}`)
    ];

    showFileList(`   📋 缺失文件列表`, allMissingFiles);
    showFileList(`   📋 空文件列表`, allEmptyFiles);
    showFileList(`   📋 孤儿文件列表`, allOrphanFiles);
    showFileList(`   📋 Git变更文件列表`, allGitChangedFiles);
    showFileList(`   📋 过期文件列表`, allOutdatedFiles);

    return totalResult;
}
