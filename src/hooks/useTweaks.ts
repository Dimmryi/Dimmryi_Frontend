import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setTweak } from '../store/tweaksSlice';
import { TweakValues } from '../types';

export const useTweaks = () => {
    const dispatch = useDispatch<AppDispatch>();
    const values = useSelector((state: RootState) => state.tweaks.values);

    const updateTweak = (key: keyof TweakValues, value: unknown) => {
        dispatch(setTweak({ [key]: value } as Partial<TweakValues>));
    };

    const updateTweaks = (edits: Partial<TweakValues>) => {
        dispatch(setTweak(edits));
    };

    return { values, updateTweak, updateTweaks };
};
