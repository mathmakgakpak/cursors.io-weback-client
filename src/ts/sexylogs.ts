const log = {
    msg: console.log.bind(window.console, '%c MSG ', "color: #212121; font-weight:bold; background-color:#b0bec5; padding: 3px 6px; border-radius: 2px;"),
    error: console.log.bind(window.console, '%c ERROR ', "color: #ffebee; font-weight:bold; background-color:#c62828; padding: 3px 6px; border-radius: 2px;"),
    warn: console.log.bind(window.console, '%c WARN ', "color: #fff3e0; font-weight:bold; background-color:#f4511e; padding: 3px 6px; border-radius: 2px;"),
    info: console.log.bind(window.console, '%c INFO ', "color: #ede7f6; font-weight:bold; background-color:#651fff; padding: 3px 6px; border-radius: 2px;"),
    success: console.log.bind(window.console, '%c SUCCESS ', "color: #e8f5e9; font-weight:bold; background-color:#2e7d32; padding: 3px 6px; border-radius: 2px;"),
    dir: console.dir.bind(window.console),
    start: console.groupCollapsed.bind(window.console),
    end: console.groupEnd.bind(window.console),
};

// @ats-ignore: that variable exists in webpack config
//if (PRODUCTION_BUILD) log.msg = log.dir = log.error = log.warn = log.info = log.success = log.start = log.end = () => {};

export default log;