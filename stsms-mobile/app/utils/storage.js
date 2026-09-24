// Storage utility abstraction for Mobile App (AsyncStorage / Web storage)

const memoryStore = {};

export const storage = {
  getItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore[key] || null;
    } catch (e) {
      return memoryStore[key] || null;
    }
  },

  setItem: async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryStore[key] = value;
    } catch (e) {
      memoryStore[key] = value;
    }
  },

  removeItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete memoryStore[key];
    } catch (e) {
      delete memoryStore[key];
    }
  }
};
