import { defineStore } from 'pinia';
import { dictionaryApi } from '../api';
import { logger } from '../utils/logger';

export const useTaskStore = defineStore('task', {
  state: () => ({
    unprocessedCount: 0,
  }),
  actions: {
    async refreshCount() {
      try {
        const { data } = await dictionaryApi.getTaskCount();
        this.unprocessedCount = data.count;
        logger.debug("Store:Task", "未处理任务数已更新", data.count);
      } catch (e) {
        logger.error("Store:Task", "更新任务数失败", e);
      }
    }
  }
});