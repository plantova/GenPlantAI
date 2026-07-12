import { v4 as uuidv4 } from 'uuid';

export const generateId = () => uuidv4();

export const generateTag = (prefix, index) => {
  return `${prefix}-${String(index).padStart(3, '0')}`;
};
