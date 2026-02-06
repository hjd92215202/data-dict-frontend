// src/utils/logger.ts

// 使用普通对象代替 enum，满足 erasableSyntaxOnly 要求
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
} as const;

type LogLevelValue = typeof LogLevel[keyof typeof LogLevel];

// 自动判断开发环境或生产环境
const CURRENT_LEVEL: LogLevelValue = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;

const styles = {
  DEBUG: "color: #909399; font-weight: bold;",
  INFO: "color: white; background: #409eff; padding: 2px 5px; border-radius: 3px;",
  WARN: "color: white; background: #e6a23c; padding: 2px 5px; border-radius: 3px;",
  ERROR: "color: white; background: #f56c6c; padding: 2px 5px; border-radius: 3px;",
  TAG: "color: #409eff; font-weight: bold; margin-left: 5px;"
};

export const logger = {
  debug: (tag: string, msg: string, data: unknown = "") => {
    if (CURRENT_LEVEL <= LogLevel.DEBUG) {
      console.log(`%c[DEBUG]%c %c${tag}%c ${msg}`, styles.DEBUG, "", styles.TAG, "", data);
    }
  },
  info: (tag: string, msg: string, data: unknown = "") => {
    if (CURRENT_LEVEL <= LogLevel.INFO) {
      console.log(`%c[INFO]%c %c${tag}%c ${msg}`, styles.INFO, "", styles.TAG, "", data);
    }
  },
  warn: (tag: string, msg: string, data: unknown = "") => {
    if (CURRENT_LEVEL <= LogLevel.WARN) {
      console.warn(`%c[WARN]%c %c${tag}%c ${msg}`, styles.WARN, "", styles.TAG, "", data);
    }
  },
  error: (tag: string, msg: string, err: unknown = "") => {
    if (CURRENT_LEVEL <= LogLevel.ERROR) {
      console.error(`%c[ERROR]%c %c${tag}%c ${msg}`, styles.ERROR, "", styles.TAG, "", err);
    }
  }
};