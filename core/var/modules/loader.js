import yaml from 'js-yaml';
import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import { pathToFileURL } from 'url';
import { resolve as resolvePath } from 'path';

function loadConfig() {
    const config = JSON.parse(readFileSync(resolvePath(global.mainPath, 'config', 'config.main.json'), 'utf8'));

    if (!config.hasOwnProperty('REFRESH')) config.REFRESH = "43200000";
    if (!config.hasOwnProperty('ABSOLUTES')) config.ABSOLUTES = [];

    config.save = () => {
        const configStringified = JSON.stringify(config, (key, value) => {
            if (key == 'save') return undefined;
            return value;
        }, 4);
        const configPathTemp = resolvePath(global.mainPath, 'config', 'config.main.temp.json');

        writeFileSync(configPathTemp, configStringified, 'utf8');
        writeFileSync(resolvePath(global.mainPath, 'config', 'config.main.json'), configStringified, 'utf8');

        unlinkSync(configPathTemp);
    }

    config.save();

    return config;
}

function loadConfigPlugins() {
    const config = JSON.parse(readFileSync(resolvePath(global.mainPath, 'config', 'config.plugins.json'), 'utf8'));
    return config;
}

function getLang(key, objectData, plugin, language = global.config.LANGUAGE) {
    if (!key || typeof key !== 'string') return '';
    if (!objectData || typeof objectData !== 'object' || Array.isArray(objectData)) objectData = {};

    let gottenData = plugin ? (global.data.langPlugin[language]?.[plugin]?.[key] || global.data.langPlugin["en_US"]?.[plugin]?.[key]) : global.data.langSystem[language]?.[key] || '';
    if (gottenData)
        for (const dataKey in objectData) {
            gottenData = gottenData.replace(`{${dataKey}}`, objectData[dataKey]);
        }

    return gottenData;
}

function loadLang() {
    try {
        const languageData = {};
        const allLangFiles = readdirSync(resolvePath('./core/var/languages')).filter(file => file.endsWith('.yml'));
        for (let i = 0; i < allLangFiles.length; i++) {
            const langFile = allLangFiles[i];
            const langFileData = yaml.load(readFileSync(resolvePath('./core/var/languages', langFile), 'utf8'));
            languageData[langFile.replace('.yml', '')] = langFileData;
        }

        return languageData;
    } catch (err) {
        console.error(err);
        global.shutdown();
    }
}

function formatPermission(permissions) {
    if (typeof permissions === 'number') {
        return Array.from(Array(permissions + 1).keys());
    } else if (typeof permissions === 'string' && !isNaN(permissions)) {
        return Array.from(Array(parseInt(permissions) + 1).keys());
    } else if (Array.isArray(permissions)) {
        return permissions;
    } else {
        return [0];
    }
}

function loadPluginLang(langData, pluginName) {
    for (const langKey in langData) {
        if (!global.data.langPlugin.hasOwnProperty(langKey)) global.data.langPlugin[langKey] = {};
        global.data.langPlugin[langKey][pluginName] = langData[langKey];
    }
}

function loadExtra(extra, pluginName) {
    const logger = global.modules.get('logger');
    try {
        if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return;
        if (!pluginName || typeof pluginName !== 'string') return;

        const extraConfigPath = resolvePath(global.mainPath, 'config', 'config.plugins.json');
        const extraConfig = readFileSync(extraConfigPath, 'utf8');
        const extraConfigParsed = JSON.parse(extraConfig);
        let changed = false;

        if (!extraConfigParsed.hasOwnProperty(pluginName)) {
            extraConfigParsed[pluginName] = {};
        }

        for (const extraKey in extra) {
            if (!extraConfigParsed[pluginName].hasOwnProperty(extraKey)) {
                extraConfigParsed[pluginName][extraKey] = extra[extraKey];
                changed = true;
            } else {
                extra[extraKey] = extraConfigParsed[pluginName][extraKey];
            }
        }

        if (changed) {
            const extraConfigStringified = JSON.stringify(extraConfigParsed, null, 2);
            const extraConfigPathTemp = resolvePath(global.mainPath, 'config', 'config.plugins.temp.json');

            writeFileSync(extraConfigPathTemp, extraConfigStringified, 'utf8');
            writeFileSync(extraConfigPath, extraConfigStringified, 'utf8');

            unlinkSync(extraConfigPathTemp);
        }
    } catch (err) {
        logger.custom(err.message || err, 'LOADER', '\x1b[31m');
    }

    return extra;
}

function aliasesValidator(commandName, aliases, _name = {}) {
    const logger = global.modules.get('logger');

    const validatedAliases = [];
    try {
        if (!aliases || !Array.isArray(aliases)) return [];
        const allAliases = [...global.plugins.commandsAliases.keys()];
        const _aliases = Array.from(new Set([...aliases, commandName, ...Object.values(typeof _name === "object" && !Array.isArray(_name) ? _name : {})]));

        for (let i = 0; i < _aliases.length; i++) {
            const alias = _aliases[i];
            if (!alias || typeof alias !== 'string') continue;
            if (allAliases.includes(alias)) continue;
            validatedAliases.push(alias);
        }

    } catch (err) {
        logger.custom(err.message || err, 'LOADER', '\x1b[31m');
    }

    return validatedAliases;
}

async function loadCommands() {
    const logger = global.modules.get('logger');

    let total = 0;
    const commandsPath = resolvePath(global.pluginsPath, 'commands');

    const pluginCategories = readdirSync(commandsPath);
    for (let i = 0; i < pluginCategories.length; i++) {
        const category = pluginCategories[i];
        if (!global.isExists(resolvePath(commandsPath, category), 'dir') || category === 'template' || category === 'example' || category === 'cache') continue;
        const categoryPath = resolvePath(commandsPath, category);
        const categoryFiles = readdirSync(categoryPath).filter(file => file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'));
        total += categoryFiles.length;

        for (const plugin of categoryFiles) {
            const fileName = plugin;
            try {
                const pluginPath = resolvePath(commandsPath, category, fileName);
                const pluginURL = pathToFileURL(pluginPath);

                pluginURL.searchParams.set('version', Number(Date.now()));

                let pluginExport = await import(pluginURL);

                pluginExport = pluginExport.default || pluginExport;
                const pluginName = plugin.slice(0, plugin.lastIndexOf('.')).toLowerCase();

                if (typeof pluginExport === 'object' && pluginExport !== null && !Array.isArray(pluginExport)) {
                    var { config, onLoad, langData, onCall } = pluginExport;
                    if (!config || typeof config !== 'object' || Array.isArray(config)) {
                        config = {
                            name: pluginName,
                            aliases: [pluginName]
                        };
                    }

                    if (!config.name) config.name = pluginName;
                    if (!config.aliases) config.aliases = [config.name];

                    config.category = category;

                    if (global.plugins.commands.has(config.name)) {
                        throw getLang('modules.loader.plugins.commands.error.nameExists', { name: config.name });
                    }

                    if (!onCall) {
                        throw getLang('modules.loader.plugins.default.error.onCallNotExists');
                    }

                    if (typeof onCall !== 'function') {
                        throw getLang('modules.loader.plugins.default.error.onCallNotFunction');
                    }

                    config.aliases = aliasesValidator(config.name, config.aliases, config._name);
                    if (config.aliases.length === 0) {
                        throw getLang('modules.loader.plugins.commands.error.noAliases');
                    }

                    config.permissions = formatPermission(config.permissions);

                    if (typeof langData === 'object' && !Array.isArray(langData)) {
                        loadPluginLang(langData, config.name);
                    }

                    if (typeof config.extra === 'object' && config.extra !== null && !Array.isArray(config.extra)) {
                        config.extra = loadExtra(config.extra, config.name)
                    } else config.extra = {};

                    if (typeof onLoad === 'function') {
                        try {
                            await onLoad({ extra: config.extra });
                        } catch (error) {
                            throw getLang('modules.loader.plugins.default.error.onLoadFailed', { error });
                        }
                    }

                    global.plugins.commands.set(config.name, onCall);
                    global.plugins.commandsConfig.set(config.name, config);
                    global.plugins.commandsAliases.set(config.name, config.aliases);
                } else if (typeof pluginExport === 'function') {
                    var config = {
                        name: pluginName,
                        aliases: [pluginName],
                        category: category
                    };

                    if (global.plugins.commands.has(config.name)) {
                        throw getLang('modules.loader.plugins.commands.error.nameExists', { name: config.name });
                    }

                    config.aliases = aliasesValidator(config.name, config.aliases);
                    if (config.aliases.length === 0) {
                        throw getLang('modules.loader.plugins.commands.error.noAliases');
                    }

                    config.extra = loadExtra({}, config.name);

                    global.plugins.commands.set(config.name, pluginExport);
                    global.plugins.commandsConfig.set(config.name, config);
                    global.plugins.commandsAliases.set(config.name, config.aliases);
                } else {
                    throw getLang('modules.loader.plugins.default.error.noExport');
                }
            } catch (error) {
                console.error(error);
                logger.custom(getLang('modules.loader.plugins.commands.error.failed', { fileName, error }), 'LOADER', '\x1b[31m');
            }
        }
    }


    logger.custom(getLang('modules.loader.plugins.commands.loaded', { commands: global.plugins.commands.size, total }), 'LOADER', '\x1b[32m');

    return true;
}

async function loadCustoms() {
    const logger = global.modules.get('logger');
    const customsPath = resolvePath(global.pluginsPath, 'customs');

    const customsFiles = readdirSync(customsPath).filter(file => file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'));

    for (const plugin of customsFiles) {
        const fileName = plugin;
        try {
            const pluginPath = resolvePath(customsPath, fileName);
            const pluginURL = pathToFileURL(pluginPath);

            pluginURL.searchParams.set('version', Number(Date.now()));

            let pluginExport = await import(pluginURL);

            pluginExport = pluginExport.default || pluginExport;
            let pluginName = plugin.slice(0, plugin.lastIndexOf('.')).toLowerCase();

            if (typeof pluginExport === 'object' && pluginExport !== null && !Array.isArray(pluginExport)) {
                var { langData, onCall } = pluginExport;
                if (!onCall) {
                    throw getLang('modules.loader.plugins.default.error.onCallNotExists');
                }

                if (typeof onCall !== 'function') {
                    throw getLang('modules.loader.plugins.default.error.onCallNotFunction');
                }

                if (typeof langData === 'object' && !Array.isArray(langData)) {
                    loadPluginLang(langData, pluginName);
                }

                const getLangForPlugin = (key, data) => getLang(key, data, pluginName);
                try {
                    global.plugins.customs++;
                    await onCall({ getLang: getLangForPlugin });
                } catch (error) {
                    console.error(error);
                }
            } else if (typeof pluginExport === 'function') {
                const getLangForPlugin = (key, data) => getLang(key, data, pluginName);
                try {
                    global.plugins.customs++;
                    await pluginExport({ getLang: getLangForPlugin });
                } catch (error) {
                    console.error(error);
                }
            } else {
                throw getLang('modules.loader.plugins.default.error.noExport');
            }
        } catch (error) {
            // console.error(error);
            logger.custom(getLang('modules.loader.plugins.customs.error.failed', { fileName, error }), 'LOADER', '\x1b[31m');
        }
    }

    logger.custom(getLang('modules.loader.plugins.customs.loaded', { customs: global.plugins.customs, total: customsFiles.length }), 'LOADER', '\x1b[32m');
}

async function loadOnMessage() {
    const logger = global.modules.get('logger');
    const onMessagePath = resolvePath(global.pluginsPath, 'onMessage');

    const onMessageFiles = readdirSync(onMessagePath).filter(file => file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'));

    for (const plugin of onMessageFiles) {
        const fileName = plugin;
        try {
            const pluginPath = resolvePath(onMessagePath, fileName);
            const pluginURL = pathToFileURL(pluginPath);

            pluginURL.searchParams.set('version', Number(Date.now()));

            let pluginExport = await import(pluginURL);

            pluginExport = pluginExport.default || pluginExport;
            let pluginName = plugin.slice(0, plugin.lastIndexOf('.')).toLowerCase();

            if (typeof pluginExport === 'object' && pluginExport !== null && !Array.isArray(pluginExport)) {
                var { onLoad, langData, onCall } = pluginExport;
                if (!onCall) {
                    throw getLang('modules.loader.plugins.default.error.onCallNotExists');
                }

                if (typeof onCall !== 'function') {
                    throw getLang('modules.loader.plugins.default.error.onCallNotFunction');
                }

                if (typeof langData === 'object' && !Array.isArray(langData)) {
                    loadPluginLang(langData, pluginName);
                }

                if (typeof onLoad === 'function') {
                    try {
                        await onLoad();
                    } catch (error) {
                        throw getLang('modules.loader.plugins.default.error.onLoadFailed', { error });
                    }
                }

                global.plugins.onMessage.set(pluginName, onCall);
            } else if (typeof pluginExport === 'function') {
                global.plugins.onMessage.set(pluginName, pluginExport);
            } else {
                throw getLang('modules.loader.plugins.default.error.noExport');
            }
        } catch (error) {
            // console.error(error);
            logger.custom(getLang('modules.loader.plugins.onMessage.error.failed', { fileName, error }), 'LOADER', '\x1b[31m');
        }
    }

    logger.custom(getLang('modules.loader.plugins.onMessage.loaded', { onMessage: global.plugins.onMessage.size, total: onMessageFiles.length }), 'LOADER', '\x1b[32m');
}

async function loadEvents() {
    const logger = global.modules.get('logger');
    const eventsPath = resolvePath(global.pluginsPath, 'events');

    const eventsFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs'));

    for (const plugin of eventsFiles) {
        const fileName = plugin;
        try {
            const pluginPath = resolvePath(eventsPath, fileName);
            const pluginURL = pathToFileURL(pluginPath);

            pluginURL.searchParams.set('version', Number(Date.now()));

            let pluginExport = await import(pluginURL);

            pluginExport = pluginExport.default || pluginExport;
            let pluginName = plugin.slice(0, plugin.lastIndexOf('.')).toLowerCase();

            if (typeof pluginExport === 'object' && pluginExport !== null && !Array.isArray(pluginExport)) {
                var { langData, onCall } = pluginExport;
                if (!onCall) {
                    throw getLang('modules.loader.plugins.default.error.onCallNotExists');
                }

                if (typeof onCall !== 'function') {
                    throw getLang('modules.loader.plugins.default.error.onCallNotFunction');
                }

                if (typeof langData === 'object' && !Array.isArray(langData)) {
                    loadPluginLang(langData, pluginName);
                }

                global.plugins.events.set(pluginName, onCall);
            } else if (typeof pluginExport === 'function') {
                global.plugins.events.set(pluginName, pluginExport);
            } else {
                throw getLang('modules.loader.plugins.default.error.noExport');
            }
        } catch (error) {
            // console.error(error);
            logger.custom(getLang('modules.loader.plugins.events.error.failed', { fileName, error }), 'LOADER', '\x1b[31m');
        }
    }

    logger.custom(getLang('modules.loader.plugins.events.loaded', { events: global.plugins.events.size, total: eventsFiles.length }), 'LOADER', '\x1b[32m');
}

async function loadPlugins() {
    await loadCommands();
    await loadCustoms();
    await loadOnMessage();
    await loadEvents();
}

export default {
    loadConfig,
    loadConfigPlugins,
    getLang,
    loadLang,
    loadPlugins
};
