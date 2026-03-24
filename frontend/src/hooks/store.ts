import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import type { AppDispatch, RootState } from '../store';

// 简体中文注释：为 Redux Hook 提供强类型，避免组件里出现 any
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

