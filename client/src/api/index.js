import * as mockApi from './mockApi.js'
import * as httpApi from './httpApi.js'

// Demo mode is OFF by default. Real backend is used unless VITE_USE_MOCK_API is explicitly 'true'.
export const USING_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

const implementation = USING_MOCK_API ? mockApi : httpApi

export const {
  listLists,
  createList,
  updateList,
  deleteList,
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  listFocusSessions,
  recordFocusSession,
  login,
  register,
  getMe,
} = implementation
