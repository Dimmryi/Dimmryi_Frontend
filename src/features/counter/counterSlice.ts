import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store/store';

export interface CounterState {
    value: number;
    properties: Property[];
}

export interface Property {
    id: number;
    name: string;
}

const initialState: CounterState = {
    value: 0,
    properties: [{ id: 0, name: 'Sample Property 0' }],
};

export const counterSlice = createSlice({
    name: 'counter',
    initialState,
    reducers: {
        increment: (state) => {
            state.value += 1;
        },
        decrement: (state) => {
            state.value -= 1;
        },
        incrementByAmount: (state, action: PayloadAction<number>) => {
            state.value += action.payload;
        },
        setNought: (state, action: PayloadAction<number>) => {
            state.value = action.payload;
        },
        setProperties: (state, action: PayloadAction<Property[]>) => {
            state.properties = action.payload;
        },
        addProperty: (state, action: PayloadAction<Property>) => {
            state.properties.push(action.payload);
        },
        removeProperty: (state, action: PayloadAction<number>) => {
            state.properties = state.properties.filter((property) => property.id !== action.payload);
        },
    },
});

export const {
    increment,
    decrement,
    incrementByAmount,
    setNought,
    setProperties,
    addProperty,
    removeProperty,
} = counterSlice.actions;
export const selectCount = (state: RootState) => state.counter.value;
export default counterSlice.reducer;
